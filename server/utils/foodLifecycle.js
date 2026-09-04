const Claim = require('../models/Claim');
const FoodPost = require('../models/FoodPost');
const User = require('../models/User');

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function notify(userId, text) {
  if (!userId || !text) return;
  await User.findByIdAndUpdate(userId, {
    $push: {
      notifications: {
        $each: [{ text: String(text).slice(0, 240), read: false, createdAt: new Date() }],
        $position: 0,
        $slice: 40
      }
    }
  });
}

async function expireStalePosts() {
  await FoodPost.updateMany(
    {
      $or: [{ quantityRemaining: { $exists: false } }, { quantityRemaining: null }]
    },
    [{ $set: { quantityRemaining: '$quantity' } }]
  );
  await FoodPost.updateMany(
    { $or: [{ status: { $exists: false } }, { status: null }, { status: '' }] },
    { $set: { status: 'available' } }
  );
  await FoodPost.updateMany(
    {
      status: { $in: ['available', 'claimed'] },
      expiryDate: { $lte: new Date() }
    },
    { $set: { status: 'expired' } }
  );
}

function isPubliclyAvailable(post) {
  if (!post) return false;
  const remaining = Number(
    post.quantityRemaining != null ? post.quantityRemaining : post.quantity
  );
  const statusOk = !post.status || post.status === 'available';
  return statusOk && remaining > 0 && new Date(post.expiryDate) > new Date();
}

async function refreshFoodStatus(foodPostId) {
  const post = await FoodPost.findById(foodPostId);
  if (!post || post.status === 'cancelled') return post;

  if (new Date(post.expiryDate) <= new Date() && post.status !== 'collected') {
    post.status = 'expired';
    await post.save();
    return post;
  }

  if (post.quantityRemaining > 0) {
    if (post.status === 'claimed' || post.status === 'collected') {
      post.status = 'available';
      await post.save();
    }
    return post;
  }

  const stillOpen = await Claim.countDocuments({
    foodPost: foodPostId,
    status: 'approved'
  });
  post.status = stillOpen > 0 ? 'claimed' : 'collected';
  await post.save();
  return post;
}

async function applyClaimStatus(claim, nextStatus, pickupCode) {
  const prev = claim.status;
  if (prev === nextStatus) return claim;

  await expireStalePosts();
  const post = await FoodPost.findById(claim.foodPost);
  if (!post) throw httpError(404, 'Food post not found');
  if (post.status === 'cancelled') throw httpError(400, 'This food post was cancelled');

  if (nextStatus === 'approved') {
    if (prev !== 'pending') throw httpError(400, 'Only pending claims can be approved');
    if (new Date(post.expiryDate) <= new Date()) {
      post.status = 'expired';
      await post.save();
      throw httpError(400, 'This food post has expired');
    }
    const remaining = Number(
      post.quantityRemaining != null ? post.quantityRemaining : post.quantity
    );
    if (remaining <= 0 || ['expired', 'collected'].includes(post.status)) {
      throw httpError(400, 'No remaining portions on this food post');
    }
    if (post.quantityRemaining == null) post.quantityRemaining = remaining;

    claim.status = 'approved';
    if (!claim.pickupCode || String(claim.pickupCode).trim().length < 4) {
      claim.pickupCode = Claim.makePickupCode();
    }
    await claim.save();
    post.quantityRemaining -= 1;
    if (post.quantityRemaining <= 0) {
      post.status = 'claimed';
      const extras = await Claim.find({
        foodPost: post._id,
        _id: { $ne: claim._id },
        status: 'pending'
      }).select('recipient');
      await Claim.updateMany(
        { foodPost: post._id, _id: { $ne: claim._id }, status: 'pending' },
        { $set: { status: 'rejected' } }
      );
      await Promise.all(
        extras.map((c) =>
          notify(c.recipient, `Your request for ${post.foodName} was rejected; no portions remain.`)
        )
      );
    }
    await post.save();
    await notify(
      claim.recipient,
      `Your request for ${post.foodName} was approved. Pickup code: ${claim.pickupCode}`
    );
    return claim;
  }

  if (nextStatus === 'rejected') {
    if (prev === 'collected') throw httpError(400, 'Collected claims cannot be rejected');
    if (prev === 'approved') {
      post.quantityRemaining += 1;
      if (post.status === 'claimed' || post.status === 'collected') {
        post.status = 'available';
      }
      await post.save();
    }
    claim.status = 'rejected';
    await claim.save();
    await notify(claim.recipient, `Your request for ${post.foodName} was rejected.`);
    return claim;
  }

  if (nextStatus === 'collected') {
    if (prev !== 'approved') throw httpError(400, 'Only approved claims can be marked collected');
    if (claim.pickupCode) {
      const given = String(pickupCode || '').trim().toUpperCase();
      if (given !== claim.pickupCode) throw httpError(400, 'Pickup code does not match');
    }
    claim.status = 'collected';
    await claim.save();
    await refreshFoodStatus(post._id);
    await notify(claim.recipient, `Pickup of ${post.foodName} was confirmed.`);
    return claim;
  }

  throw httpError(400, 'Invalid status value');
}

async function cancelFoodPost(post) {
  const pending = await Claim.find({ foodPost: post._id, status: 'pending' }).select('recipient');
  post.status = 'cancelled';
  await post.save();
  await Claim.updateMany(
    { foodPost: post._id, status: 'pending' },
    { $set: { status: 'rejected' } }
  );
  await Promise.all(
    pending.map((c) =>
      notify(c.recipient, `A food post you requested (${post.foodName}) was cancelled.`)
    )
  );
  return post;
}

module.exports = {
  expireStalePosts,
  isPubliclyAvailable,
  refreshFoodStatus,
  applyClaimStatus,
  cancelFoodPost,
  notify,
  makePickupCode: Claim.makePickupCode
};

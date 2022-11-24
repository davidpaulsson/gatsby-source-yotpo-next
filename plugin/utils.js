'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.getReview = exports.getReviews = void 0;
const axios_1 = __importDefault(require('axios'));
const getReviews = async (page = 1, options, cache) => {
  const cachedReviews = await cache.get(`yotpo-reviews`);
  if (cachedReviews) {
    return cachedReviews;
  }
  const {
    data: { response },
  } = await axios_1.default.get(
    `https://api.yotpo.com/v1/widget/${options.appKey}/reviews.json?per_page=40&page=${page}`,
    {
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
    },
  );
  const { pagination } = response;
  const { total, per_page } = pagination;
  if (page * per_page < total) {
    return [
      ...response.reviews,
      ...(await (0, exports.getReviews)(page + 1, options, cache)),
    ];
  }
  await cache.set(`yotpo-reviews`, response.reviews);
  return response.reviews;
};
exports.getReviews = getReviews;
const getReview = async (reviewId, utoken, cache) => {
  const cachedReview = await cache.get(`yotpo-get-review-${reviewId}`);
  if (cachedReview) {
    return cachedReview;
  }
  const {
    data: { response },
  } = await axios_1.default.get(
    `https://api.yotpo.com/reviews/${reviewId}?utoken=${utoken}`,
    {
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
    },
  );
  await cache.set(
    `yotpo-get-review-${reviewId}`,
    JSON.stringify(response.review),
  );
  return response.review;
};
exports.getReview = getReview;

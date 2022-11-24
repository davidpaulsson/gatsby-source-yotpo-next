import axios from 'axios';
import { GatsbyCache, PluginOptions } from 'gatsby';

export const getReviews = async (
  page: number = 1,
  options: PluginOptions & YotpoPluginOptions,
  cache: GatsbyCache,
): Promise<YotpoReview[]> => {
  const cachedReviews = await cache.get(`yotpo-reviews`);
  if (cachedReviews) {
    return cachedReviews;
  }

  const {
    data: { response },
  } = await axios.get(
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
      ...(await getReviews(page + 1, options, cache)),
    ];
  }

  await cache.set(`yotpo-reviews`, response.reviews);
  return response.reviews;
};

export const getReview = async (
  reviewId: number,
  utoken: string,
  cache: GatsbyCache,
): Promise<YotpoReview[]> => {
  const cachedReview = await cache.get(`yotpo-get-review-${reviewId}`);
  if (cachedReview) {
    return cachedReview;
  }

  const {
    data: { response },
  } = await axios.get(
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

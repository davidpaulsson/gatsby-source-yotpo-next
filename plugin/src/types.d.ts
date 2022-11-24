type YotpoPluginOptions = {
  appKey: string;
  appSecret: string;
};

type YotpoReview = {
  id: number;
  score: number;
  votesUp: number;
  votesDown: number;
  content: string;
  title: string;
  createdAt: date;
  deleted: boolean;
  verifiedBuyer: boolean;
  sourceReviewId: null;
  sentiment: number;
  customFields: null;
  productId: number;
  imagesData: {
    id: number;
    thumbUrl: string;
    originalUrl: string;
  }[];
  user: {
    userId: number;
    socialImage: null;
    userType: 'User';
    isSocialConnected: number;
    displayName: string;
  };
};

'use strict';
// https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.createSchemaCustomization =
  exports.onCreateNode =
  exports.sourceNodes =
  exports.pluginOptionsSchema =
    void 0;
const axios_1 = __importDefault(require('axios'));
const utils_1 = require('./utils');
const mapKeys_1 = __importDefault(require('lodash/mapKeys'));
const camelCase_1 = __importDefault(require('lodash/camelCase'));
const isString_1 = __importDefault(require('lodash/isString'));
const gatsby_source_filesystem_1 = require('gatsby-source-filesystem');
const isArray_1 = __importDefault(require('lodash/isArray'));
const constants_1 = require('./constants');
// https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/#pluginOptionsSchema
const pluginOptionsSchema = ({ Joi }) => {
  return Joi.object({
    appKey: Joi.string().required(),
    appSecret: Joi.string().required(),
  });
};
exports.pluginOptionsSchema = pluginOptionsSchema;
// https://www.gatsbyjs.org/docs/node-apis/#sourceNodes
const sourceNodes = async (args, options) => {
  const {
    actions,
    cache,
    createNodeId,
    getNode,
    createContentDigest,
    reporter,
  } = args;
  const activity = reporter.activityTimer('Yotpo: Create nodes');
  activity.start();
  const { createNode, touchNode } = actions;
  let reviews;
  let accessToken;
  /**
   * First we need to get the access token from Yotpo
   */
  try {
    const {
      data: { access_token },
    } = await axios_1.default.post(
      'https://api.yotpo.com/oauth/token',
      {
        grant_type: 'client_credentials',
        client_id: options.appKey,
        client_secret: options.appSecret,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
      },
    );
    accessToken = access_token;
    reporter.verbose(
      `Yotpo: Successfully got Yotpo access token: ${access_token}`,
    );
  } catch (error) {
    reporter.panicOnBuild(
      `Yotpo: Error while getting Yotpo access token: ${error}`,
    );
  }
  /**
   * Then we need to get the reviews from Yotpo
   */
  try {
    reviews = await (0, utils_1.getReviews)(1, options, cache);
    reporter.info(`Yotpo: ${reviews.length} product reviews`);
  } catch (error) {
    reporter.panicOnBuild(`Yotpo: Error while getting Yotpo reviews: ${error}`);
  }
  /**
   * Then we need to create the nodes
   */
  try {
    for (const review of reviews || []) {
      const nodeId = createNodeId(`yotpo-product-review-${review.id}`);
      // @ts-ignore
      const extraData = await (0, utils_1.getReview)(
        review.id,
        accessToken,
        cache,
      );
      const nodeMeta = {
        id: nodeId,
        parent: null,
        children: [],
        internal: {
          type: constants_1.YOTPO_NODE_TYPE_NAME,
          contentDigest: createContentDigest(review),
        },
      };
      const camelCasedReview = {
        yotpoId: review.id,
        ...(0, mapKeys_1.default)(review, (_value, key) =>
          (0, isString_1.default)(key) ? (0, camelCase_1.default)(key) : key,
        ),
        user: (0, mapKeys_1.default)(review.user, (_value, key) =>
          (0, isString_1.default)(key) ? (0, camelCase_1.default)(key) : key,
        ),
        // @ts-ignore
        imagesData: (0, isArray_1.default)(review.images_data)
          ? // @ts-ignore
            review.images_data.map((data) =>
              (0, mapKeys_1.default)(data, (_value, key) =>
                (0, isString_1.default)(key)
                  ? (0, camelCase_1.default)(key)
                  : key,
              ),
            )
          : null,
      };
      const node = {
        // @ts-expect-error extra data is not typed
        comments: (0, isArray_1.default)(extraData.comments)
          ? // @ts-expect-error extra data is not typed
            (0, mapKeys_1.default)(extraData.comments, (_value, key) =>
              (0, isString_1.default)(key)
                ? (0, camelCase_1.default)(key)
                : key,
            )
          : null,
        // @ts-expect-error extra data is not typed
        reviewForSkus: (0, isArray_1.default)(extraData.products_apps)
          ? // @ts-expect-error extra data is not typed
            extraData.products_apps.map((obj) => obj.domain_key).filter(Boolean)
          : null,
        ...camelCasedReview,
        ...nodeMeta,
      };
      await createNode(node);
    }
    reporter.info(
      `Creating ${(reviews || [])?.length} Yotpo product review nodes`,
    );
  } catch (error) {
    reporter.panicOnBuild(
      `Yotpo: Error while creating Yotpo review nodes: ${error}`,
    );
  }
  activity.end();
};
exports.sourceNodes = sourceNodes;
// https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/#onCreateNode
const onCreateNode = async ({
  node, // the node that was just created
  actions: { createNode, createNodeField },
  createNodeId,
  getCache,
}) => {
  if (node.internal.type === constants_1.YOTPO_NODE_TYPE_NAME) {
    const localImagesData = [];
    if ((0, isArray_1.default)(node.imagesData)) {
      for (const image of node.imagesData) {
        const fileNode = await (0,
        gatsby_source_filesystem_1.createRemoteFileNode)({
          url: image.originalUrl,
          parentNodeId: node.id,
          createNode,
          createNodeId,
          getCache,
        });
        if (fileNode) {
          localImagesData.push(fileNode.id);
        }
      }
      if (localImagesData.length > 0) {
        createNodeField({
          node,
          name: 'localImagesData',
          value: localImagesData,
        });
      }
    }
  }
};
exports.onCreateNode = onCreateNode;
const createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions;
  createTypes(`
      type YotpoProductReview implements Node {
        localImagesData: [File] @link(from: "fields.localImagesData")
      }
  `);
};
exports.createSchemaCustomization = createSchemaCustomization;

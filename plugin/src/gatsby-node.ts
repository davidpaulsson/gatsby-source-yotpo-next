// https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/

import { GatsbyNode, PluginOptions, SourceNodesArgs } from 'gatsby';
import axios from 'axios';
import { getReview, getReviews } from './utils';
import mapKeys from 'lodash/mapKeys';
import camelCase from 'lodash/camelCase';
import isString from 'lodash/isString';
import { createRemoteFileNode } from 'gatsby-source-filesystem';
import isArray from 'lodash/isArray';
import { YOTPO_NODE_TYPE_NAME } from './constants';

// https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/#pluginOptionsSchema
export const pluginOptionsSchema: GatsbyNode['pluginOptionsSchema'] = ({
  Joi,
}) => {
  return Joi.object({
    appKey: Joi.string().required(),
    appSecret: Joi.string().required(),
  });
};

// https://www.gatsbyjs.org/docs/node-apis/#sourceNodes
export const sourceNodes: GatsbyNode['sourceNodes'] = async (
  args: SourceNodesArgs,
  options: PluginOptions & YotpoPluginOptions,
): Promise<void> => {
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
  let accessToken: string;

  /**
   * First we need to get the access token from Yotpo
   */
  try {
    const {
      data: { access_token },
    } = await axios.post(
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
    reviews = await getReviews(1, options, cache);
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
      const extraData = await getReview(review.id, accessToken, cache);

      const nodeMeta = {
        id: nodeId,
        parent: null,
        children: [],
        internal: {
          type: YOTPO_NODE_TYPE_NAME,
          contentDigest: createContentDigest(review),
        },
      };

      const camelCasedReview = {
        yotpoId: review.id,
        ...mapKeys(review, (_value, key) =>
          isString(key) ? camelCase(key) : key,
        ),
        user: mapKeys(review.user, (_value, key) =>
          isString(key) ? camelCase(key) : key,
        ),
        // @ts-ignore
        imagesData: isArray(review.images_data)
          ? // @ts-ignore
            review.images_data.map((data: any) =>
              mapKeys(data, (_value, key) =>
                isString(key) ? camelCase(key) : key,
              ),
            )
          : null,
      };

      const node = {
        // @ts-expect-error extra data is not typed
        comments: isArray(extraData.comments)
          ? // @ts-expect-error extra data is not typed
            mapKeys(extraData.comments, (_value, key) =>
              isString(key) ? camelCase(key) : key,
            )
          : null,
        // @ts-expect-error extra data is not typed
        reviewForSkus: isArray(extraData.products_apps)
          ? // @ts-expect-error extra data is not typed
            extraData.products_apps
              .map((obj: { domain_key: any }) => obj.domain_key)
              .filter(Boolean)
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

// https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/#onCreateNode
export const onCreateNode: GatsbyNode['onCreateNode'] = async ({
  node, // the node that was just created
  actions: { createNode, createNodeField },
  createNodeId,
  getCache,
}) => {
  if (node.internal.type === YOTPO_NODE_TYPE_NAME) {
    const localImagesData = [];
    if (isArray(node.imagesData)) {
      for (const image of node.imagesData as Array<{ originalUrl: string }>) {
        const fileNode = await createRemoteFileNode({
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

export const createSchemaCustomization: GatsbyNode['createSchemaCustomization'] =
  ({ actions }) => {
    const { createTypes } = actions;

    createTypes(`
      type YotpoProductReview implements Node {
        localImagesData: [File] @link(from: "fields.localImagesData")
      }
  `);
  };

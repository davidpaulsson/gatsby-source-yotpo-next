// https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/

import { GatsbyNode } from "gatsby";

const { EMOJIS } = require("./constants");

const validKeys = Object.keys(EMOJIS);

export const pluginOptionsSchema: GatsbyNode["pluginOptionsSchema"] = ({
  Joi,
}) => {
  return Joi.object({
    message: Joi.string().default("Hello from the Plugin"),
    emoji: Joi.string()
      .valid(...validKeys)
      .default(validKeys[0])
      .description(`Select between the emoji options`),
  });
};

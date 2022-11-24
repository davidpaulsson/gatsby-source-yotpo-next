"use strict";
// https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginOptionsSchema = void 0;
const { EMOJIS } = require("./constants");
const validKeys = Object.keys(EMOJIS);
const pluginOptionsSchema = ({ Joi }) => {
  return Joi.object({
    message: Joi.string().default("Hello from the Plugin"),
    emoji: Joi.string()
      .valid(...validKeys)
      .default(validKeys[0])
      .description(`Select between the emoji options`),
  });
};
exports.pluginOptionsSchema = pluginOptionsSchema;

// Ash Public
// @.fuckme
// * This file is presented in its entire unmodified form.

const { Enum } = require("../modules/utilityFunctions.js");
const { inspect } = require("util");

module.exports = {
   name: "eval",
   description: "Evaluates JavaScript. Runs with access to `client` and exports such as `Enum`.",
   category: "System",
   usage: "eval [..code]",
   aliases: ["e"],
   adminOnly: true,
   argsRequired: true,
   async execute(client, message, args) {
      const content = args.join(" ").trim();
      let msg = await message.channel.send(`${client.config.emojis.loading} Evaluating...`);
      try {
         const t = performance.now();
         const result = await eval(content);
         msg.edit({ content: `${(performance.now() - t).toFixed(2)} ms\`\`\`js\n${typeof result === "object" ? inspect(result, {depth: 0}) : result + " "}\`\`\`` });
      } catch (err) {
         return msg.edit({ content: `\`\`\`js\n${err}\`\`\`` });
      }
   }
}
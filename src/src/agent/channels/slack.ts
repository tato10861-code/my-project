import { connectSlackCredentials } from "@vercel/connect/eve";
import { defaultSlackAuth, slackChannel } from "eve/channels/slack";

export default slackChannel({
  credentials: connectSlackCredentials("slack/propauto-ai-operations"),
  onAppMention(ctx, message) {
    return { auth: defaultSlackAuth(message, ctx) };
  },
  onDirectMessage(ctx, message) {
    return { auth: defaultSlackAuth(message, ctx) };
  },
  async onMessage(ctx, message) {
    if (message.author?.isBot) return null;
    const isDirectMessage = message.raw.channel_type === "im";
    const isMentioned = await ctx.isBotMentioned();
    const isSubscribed = await ctx.isSubscribed();
    return isDirectMessage || isMentioned || isSubscribed
      ? { auth: defaultSlackAuth(message, ctx) }
      : null;
  },
});

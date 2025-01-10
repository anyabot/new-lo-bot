import { SlashCommand, SlashCreator, CommandContext } from 'slash-create';
import { load } from 'cheerio';
import { BASE_WIKI } from '..';

export default class ArcaCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'apk',
      description: "Give the latest Korean Uncensored apk link",
    });
  }

  async run(ctx: CommandContext) {
    await ctx.defer();
    const link = `${BASE_WIKI}/wiki/Template:KoreaApk`;
    try {
      const res = await fetch(link, { method: 'GET' });
      const body = await res.text();
      const $ = load(body);
      let result = $("#apklink a").attr("href");
      if (result.length > 0) {
        ctx.send(`<${result}>`);
      } else {
        ctx.send("Can't find anything");
      }
    }
    catch (err) {
      ctx.send("Can't find anything");
      console.log(err, link);
    }
  }
}

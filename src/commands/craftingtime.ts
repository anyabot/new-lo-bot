import { SlashCommand, CommandOptionType, SlashCreator, CommandContext, MessageEmbedOptions } from 'slash-create';
import { load } from 'cheerio';
import { nameChange, restoreImageLink, sendPages } from '../library/functions';
import { BASE_WIKI } from '..';

export default class CraftingTimeCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'craftingtime',
      description: 'Search a unit of their crafting time or vice versa',
      options: [
        {
          type: CommandOptionType.STRING,
          name: 'key',
          description: 'The unit or time to search for',
          required: true
        }
      ]
    });
  }

  async run(ctx: CommandContext) {
    await ctx.defer();
    const text = ctx.options['key'];

    var time = text.toLowerCase();
    var link = `${BASE_WIKI}/wiki/Crafting_Timetable`;
    try {
      const res = await fetch(link, { method: 'GET' });
      const body = await res.text();
      const $ = load(body);
      let siz = $('.mw-parser-output table tbody').first().find('tr').length;
      const pages: MessageEmbedOptions[] = [];
      for (var i = 2; i <= siz; i++) {
        let ti = $('.mw-parser-output table tbody tr:nth-child(' + i + ') td:nth-child(4)')
          .first()
          .text();
        if (time.toLowerCase() == ti.trim().toLowerCase()) {
          let unit = $('.mw-parser-output table tbody tr:nth-child(' + i + ') td:nth-child(2)')
            .first()
            .text()
            .trim();
          let link2 = `${BASE_WIKI}/wiki/${encodeURI(unit)}`;
          let img = $('.mw-parser-output table tbody tr:nth-child(' + i + ') td:nth-child(1) div a img')
            .first()
            .attr('data-src');
          if (!img) {
            img = $('.mw-parser-output table tbody tr:nth-child(' + i + ') td:nth-child(1) div a img')
              .first()
              .attr('src');
          }
          img = restoreImageLink(img);
          console.log(img);
          let embed: MessageEmbedOptions = {
            title: unit,
            url: link2,
            image: { url: img }
          };
          pages.push(embed);
        }
      }
      if (pages.length > 0) {
        sendPages(ctx, pages);
      } else {
        let times: string[] = [];
        let unit = nameChange(time);
        let siz = $('.mw-parser-output table tbody').first().find('tr').length;
        for (var i = 2; i <= siz; i++) {
          let na = $('.mw-parser-output table tbody tr:nth-child(' + i + ') td:nth-child(2)')
            .first()
            .text()
            .trim();
          if (unit.toLowerCase() == na.toLowerCase()) {
            times.push(
              $('.mw-parser-output table tbody tr:nth-child(' + i + ') td:nth-child(4)')
                .first()
                .text()
                .trim()
            );
          }
        }
        if (times.length > 0) {
          ctx.send(times.join('\n'));
        } else {
          ctx.send('Wrong Input');
        }
      }
    } catch (err) {
      ctx.send("Can't find anything");
      console.log(err, link);
    }
  }
}

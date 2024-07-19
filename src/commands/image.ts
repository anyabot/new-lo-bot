import { SlashCommand, CommandOptionType, SlashCreator, CommandContext, MessageEmbedOptions } from 'slash-create';
import { load } from 'cheerio';
import { nameChange, restoreImageLink, sendPages } from '../library/functions';
import { BASE_WIKI } from '..';

export default class ImageCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'image',
      description: "Search unit's image",
      options: [
        {
          type: CommandOptionType.STRING,
          name: 'unit',
          description: 'The unit to search images for',
          required: true
        }
      ]
    });
  }

  async run(ctx: CommandContext) {
    await ctx.defer();
    const text = ctx.options['unit'];
    if (!text) return 'No unit name';
    const unit = nameChange(text);
    const link = `${BASE_WIKI}/wiki/${encodeURI(unit)}`;
    try {
      const res = await fetch(link, { method: 'GET' });
      const body = await res.text();
      const $ = load(body);
      var check = false;
      let img;
      const pages: MessageEmbedOptions[] = [];
      var page = 1;
      $('.skin').each(function (i, elem) {
        let img = $(elem).find('img').attr('data-src');
        if (img) {
          check = true;
          img = restoreImageLink(img, true);
          let embed: MessageEmbedOptions = {
            title: unit,
            url: link,
            image: { url: img }
          };
          pages.push(embed);
        } else {
          let embed: MessageEmbedOptions = {
            title: unit,
            image: { url: img },
            url: link
          };
          img = $(elem).find('img').attr('src');
          if (img) {
            check = true;
            img = restoreImageLink(img, true);
            embed.image = { url: img };
          } else {
            embed.fields = [
              {
                name: 'Image Error',
                value: 'Image Missing in Wiki'
              }
            ];
          }
          pages.push(embed);
        }
      });
      if (check) {
        sendPages(ctx, pages);
      }
      else {
        return ctx.send("Can't find anything");
      }
    } catch (err) {
      ctx.send("Can't find anything");
      console.log(err, link);
    }
  }
}

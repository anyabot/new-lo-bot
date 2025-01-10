import { SlashCommand, CommandOptionType, SlashCreator, CommandContext, MessageEmbedOptions } from 'slash-create';
import { load } from 'cheerio';
import { BASE_WIKI } from '..';

export default class SearchCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'search',
      description: 'Search something on Last Origin International Wiki',
      options: [
        {
          type: CommandOptionType.STRING,
          name: 'key',
          description: 'The keyword to search for',
          required: true
        }
      ]
    });
  }

  async run(ctx: CommandContext) {
    await ctx.defer();
    const text = ctx.options['key'];
    const link = `${BASE_WIKI}/index.php?search=${encodeURI(text)}&title=Special%3ASearch&profile=default&fulltext=1`;
    try {
      const res = await fetch(link, { method: 'GET' });
      const body = await res.text();
      const $ = load(body);
      var out = '';
      var max = 6;
      for (var i = 1; i < max; i++) {
        let tex = $('.mw-search-results li:nth-child(' + i + ') .mw-search-result-heading a').attr('title');
        let li = $('.mw-search-results li:nth-child(' + i + ') .mw-search-result-heading a').attr('href');
        if (tex != null && li != null) {
          out = out + `${tex.trim()}: <${BASE_WIKI}${decodeURI(li.trim())}>\n`;
        }
      }
      if (out != '') {
        ctx.send(out);
      } else {
        ctx.send('No Result');
      }
    } catch (err) {
      ctx.send("Can't find anything");
      console.log(err, link);
    }
  }
}
function addEmbed(img: string, name: string, skill: string, range: string, aoe: string, link: string) {
  let embed: MessageEmbedOptions = {
    title: name,
    url: link,
    thumbnail: { url: img },
    description: skill,
    fields: []
  };
  if (range) {
    embed.fields.push({
      name: 'Range/Cost',
      value: range
    });
  }
  if (aoe) {
    embed.image = { url: aoe };
  } else {
    embed.fields.push({
      name: 'AoE',
      value: 'Self'
    });
  }
  return embed;
}

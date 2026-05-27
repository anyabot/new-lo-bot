import { SlashCommand, CommandOptionType, SlashCreator, CommandContext } from 'slash-create';
import { wikiSearch } from '../library/functions';
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
    try {
      const titles = await wikiSearch(text, 10);
      if (titles.length === 0) return ctx.send('No Result');
      const out = titles.map(t => `${t}: <${BASE_WIKI}/wiki/${encodeURI(t)}>`).join('\n');
      ctx.send(out);
    } catch (err) {
      ctx.send("Can't find anything");
      console.log(err);
    }
  }
}

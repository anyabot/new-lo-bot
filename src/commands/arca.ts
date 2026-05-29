import { SlashCommand, CommandOptionType, SlashCreator, CommandContext } from 'slash-create';
import { getEvents, sanitizeKey } from '../library/firebase';

export default class ArcaCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'arca',
      description: "Give arca's forum page of an event",
      options: [
        {
          type: CommandOptionType.STRING,
          name: 'key',
          description: 'The event to search for',
          required: true
        }
      ]
    });
  }

  async run(ctx: CommandContext) {
    await ctx.defer();
    const ev = sanitizeKey(ctx.options['key'].toLowerCase());
    try {
      const events = await getEvents();
      if (events[ev]) {
        await ctx.send(events[ev]);
      } else {
        await ctx.send('Can not find');
      }
    } catch (err) {
      console.error('Firebase event lookup failed:', err);
      await ctx.send('Error fetching event data');
    }
  }
}

import { SlashCommand, CommandOptionType, SlashCreator, CommandContext } from 'slash-create';
import { event } from "../library/event"

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
      var ev = ctx.options["key"].toLowerCase();
      if (event[ev]) { { ctx.send(event[ev]) } }
      else {ctx.send("Can not find")}
  }
}

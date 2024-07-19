import { name } from './name';
import {
  CommandContext,
  ComponentType,
  ButtonStyle,
  AnyComponentButton,
  MessageEmbedOptions,
  ComponentContext,
  ComponentActionRow,
  ComponentSelectMenu
} from 'slash-create';
import { BASE_WIKI } from '..';

function titleCase(str: string) {
  const str_list = str.toLowerCase().split(' ');
  for (var i = 0; i < str_list.length; i++) {
    if (str_list[i][0] == '(' && str_list[i].length > 1) {
      str_list[i] = '(' + str_list[i].charAt(1).toUpperCase() + str_list[i].slice(2);
    } else {
      str_list[i] = str_list[i].charAt(0).toUpperCase() + str_list[i].slice(1);
    }
  }
  return str_list.join(' ');
}
export const nameChange = function nameChange(text: string) {
  let unit = text.toLowerCase();
  if (name[text]) {
    unit = name[text.toLowerCase()];
  }
  else {
    unit = titleCase(unit);
  }
  console.log(unit);
  return unit;
};

export function te(output: string) {
  if (output == null) {
    return null;
  }
  output = output.replace(/<[^>]*>/g, '\n');
  output = output.replace(/\n+ /g, '\n');
  output = output.trim();
  var arr = output.split('\n');
  var filtered = arr.filter(function (el) {
    return el != null && el != '' && el.substring(0, 12) != 'This ability';
  });
  return filtered.join('\n');
}

export function restoreImageLink(output: string, removeSize: boolean = false) {
  console.log(output);
  if (!output.includes(BASE_WIKI)) output = BASE_WIKI + output;
  if (output.includes("/thumb/") && removeSize) {
    let split = output.split("/thumb/");
    output = `${split[0]}/${split[1]}`;
    split = output.split(/\/([^\/])+px-/g);
    output = split[0];
  }
  return output;
}

export const sendPages = async function (ctx: CommandContext, pages: MessageEmbedOptions[]) {
  if (pages.length == 1) {
    ctx.send({
      embeds: [pages[0]]
    });
  } else {
    // const backButton = new ButtonBuilder()
    //   .setCustomId("back")
    //   .setLabel("Prev Page")
    //   .setEmoji("⬅️")
    //   .setStyle(ButtonStyle.Secondary)
    //   .setDisabled(true);

    // const forwardButton = new ButtonBuilder()
    //   .setCustomId("forward")
    //   .setLabel("Next Page")
    //   .setEmoji("➡️")
    //   .setStyle(ButtonStyle.Secondary);

    const backButton: AnyComponentButton = {
      type: ComponentType.BUTTON,
      label: '',
      custom_id: 'back',
      emoji: { name: '⬅️' },
      style: ButtonStyle.SECONDARY,
      disabled: true
    };

    const forwardButton: AnyComponentButton = {
      type: ComponentType.BUTTON,
      label: '',
      custom_id: 'forward',
      emoji: { name: '➡️' },
      style: ButtonStyle.SECONDARY
    };

    const firstButton: AnyComponentButton = {
      type: ComponentType.BUTTON,
      label: '',
      custom_id: 'first',
      emoji: { name: '⏮️' },
      style: ButtonStyle.SECONDARY,
      disabled: true
    };

    const lastButton: AnyComponentButton = {
      type: ComponentType.BUTTON,
      label: '',
      custom_id: 'last',
      emoji: { name: '⏭️' },
      style: ButtonStyle.SECONDARY
    };

    const jumpOptions: ComponentSelectMenu = {
      type: ComponentType.STRING_SELECT,
      custom_id: 'jump',
      placeholder: "Jump to a Page",
      options: pages.map((_, index) => { 
        let page_num = String(index + 1)
        return {
          label: `Jump to Page ${page_num}`,
          value: page_num,
        }
      })
    }

    const rows: ComponentActionRow[] = [
      {
        type: ComponentType.ACTION_ROW,
        components: [jumpOptions]
      },
      {
        type: ComponentType.ACTION_ROW,
        components: [firstButton, backButton, forwardButton, lastButton]
      },
    ]

    const updateButtons = async (btnCtx: ComponentContext) => {
      console.log(`Switching to Page ${page}`)
      forwardButton.disabled = page == pages.length;
      backButton.disabled = page == 1;
      lastButton.disabled = page == pages.length;
      firstButton.disabled = page == 1;
      await btnCtx.editOriginal({
        embeds: [embed],
        components: rows
      });
    };

    var embed = pages[0];
    let page = 1;
    embed = pages[0];
    embed.footer = { text: 'Page ' + page + ' of ' + pages.length };

    // const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    //   backButton,
    //   forwardButton
    // );
    const response = await ctx.send({
      embeds: [pages[0]],
      components: rows
    });
    try {
      ctx.registerComponent('back', async (btnCtx) => {
        if (page > 1) page -= 1;
        embed = pages[page - 1];
        embed.footer = { text: 'Page ' + page + ' of ' + pages.length };
        await updateButtons(btnCtx);
      });
      ctx.registerComponent('forward', async (btnCtx) => {
        if (page < pages.length) page += 1;
        embed = pages[page - 1];
        embed.footer = { text: 'Page ' + page + ' of ' + pages.length };
        await updateButtons(btnCtx);
      });
      ctx.registerComponent('first', async (btnCtx) => {
        page = 1;
        embed = pages[page - 1];
        embed.footer = { text: 'Page ' + page + ' of ' + pages.length };
        await updateButtons(btnCtx);
      });
      ctx.registerComponent('last', async (btnCtx) => {
        page = pages.length;
        embed = pages[page - 1];
        embed.footer = { text: 'Page ' + page + ' of ' + pages.length };
        await updateButtons(btnCtx);
      });
      ctx.registerComponent('jump', async (selectCtx) => {
        page = Number(selectCtx.values[0]);
        embed = pages[page - 1];
        embed.footer = { text: 'Page ' + page + ' of ' + pages.length };
        await updateButtons(selectCtx);
      });
    } catch {
      return;
    }
  }
};
export const sendPagesWithNumber = async function (ctx: CommandContext, originalPages: MessageEmbedOptions[], switchPages?: MessageEmbedOptions[]) {
  let pages = originalPages;
  let swapped = false;
  if (pages.length == 1) {
    ctx.send({
      embeds: [pages[0]]
    });
  } else {
    // const backButton = new ButtonBuilder()
    //   .setCustomId("back")
    //   .setLabel("Prev Page")
    //   .setEmoji("⬅️")
    //   .setStyle(ButtonStyle.Secondary)
    //   .setDisabled(true);

    // const forwardButton = new ButtonBuilder()
    //   .setCustomId("forward")
    //   .setLabel("Next Page")
    //   .setEmoji("➡️")
    //   .setStyle(ButtonStyle.Secondary);

    const oneButton: AnyComponentButton = {
      type: ComponentType.BUTTON,
      label: 'A1',
      custom_id: 'one',
      emoji: { name: '1️⃣' },
      style: ButtonStyle.SECONDARY
    };

    const twoButton: AnyComponentButton = {
      type: ComponentType.BUTTON,
      label: 'A2',
      custom_id: 'two',
      emoji: { name: '2️⃣' },
      style: ButtonStyle.SECONDARY
    };

    const threeButton: AnyComponentButton = {
      type: ComponentType.BUTTON,
      label: 'P1',
      custom_id: 'three',
      emoji: { name: '3️⃣' },
      style: ButtonStyle.SECONDARY
    };

    const fourButton: AnyComponentButton = {
      type: ComponentType.BUTTON,
      label: 'P2',
      custom_id: 'four',
      emoji: { name: '4️⃣' },
      style: ButtonStyle.SECONDARY
    };

    const fiveButton: AnyComponentButton = {
      type: ComponentType.BUTTON,
      label: 'P3',
      custom_id: 'five',
      emoji: { name: '5️⃣' },
      style: ButtonStyle.SECONDARY
    };

    const swapButton: AnyComponentButton = {
      type: ComponentType.BUTTON,
      label: 'Form Change',
      custom_id: 'swap',
      emoji: { name: '🔄' },
      style: ButtonStyle.SECONDARY
    };

    var embed = pages[0];
    let page = 1;
    embed = pages[0];
    embed.footer = { text: 'Page ' + page + ' of ' + pages.length };

    const allComponents = [oneButton, twoButton, threeButton, fourButton, fiveButton];
    const components = allComponents.slice(0, pages.length);
    const rows: ComponentActionRow[] = [{
        type: ComponentType.ACTION_ROW,
        components: components
    }]
    if (switchPages) {
      rows.push({
        type: ComponentType.ACTION_ROW,
        components: [swapButton]
      })
    }
    // components.push(swapButton)

    const updateButtons = async (btnCtx: ComponentContext) => {
      await btnCtx.editOriginal({
        embeds: [embed],
        components: rows
      });
    };

    // const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    //   backButton,
    //   forwardButton
    // );
    const response = await ctx.send({
      embeds: [pages[0]],
      components: rows
    });
    try {
      ctx.registerComponent('one', async (btnCtx) => {
        page = 1;
        if (page > pages.length) page = pages.length;
        embed = pages[page - 1];
        embed.footer = { text: 'Page ' + page + ' of ' + pages.length };
        await updateButtons(btnCtx);
      });
      ctx.registerComponent('two', async (btnCtx) => {
        page = 2;
        if (page > pages.length) page = pages.length;
        embed = pages[page - 1];
        embed.footer = { text: 'Page ' + page + ' of ' + pages.length };
        await updateButtons(btnCtx);
      });
      ctx.registerComponent('three', async (btnCtx) => {
        page = 3;
        if (page > pages.length) page = pages.length;
        embed = pages[page - 1];
        embed.footer = { text: 'Page ' + page + ' of ' + pages.length };
        await updateButtons(btnCtx);
      });
      ctx.registerComponent('four', async (btnCtx) => {
        page = 4;
        if (page > pages.length) page = pages.length;
        embed = pages[page - 1];
        embed.footer = { text: 'Page ' + page + ' of ' + pages.length };
        await updateButtons(btnCtx);
      });
      ctx.registerComponent('five', async (btnCtx) => {
        page = 5;
        if (page > pages.length) page = pages.length;
        embed = pages[page - 1];
        embed.footer = { text: 'Page ' + page + ' of ' + pages.length };
        await updateButtons(btnCtx);
      });
      ctx.registerComponent('swap', async (btnCtx) => {
        if (swapped) {
          pages = originalPages;
          swapped = false;
        }
        else {
          pages = switchPages;
          swapped = true
        }
        embed = pages[page - 1];
        embed.footer = { text: 'Page ' + page + ' of ' + pages.length };
        await updateButtons(btnCtx);
      });
    } catch {
      return;
    }
  }
};

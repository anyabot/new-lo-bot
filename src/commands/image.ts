import { SlashCommand, CommandOptionType, SlashCreator, CommandContext, MessageEmbedOptions, ComponentType, AnyComponentButton, AnySelectComponent, ButtonStyle, ComponentActionRow } from 'slash-create';
import { load } from 'cheerio';
import { nameChange, restoreImageLink, wikiSearch } from '../library/functions';
import { BASE_WIKI } from '..';

interface SkinGroup {
  label: string;
  images: string[];
}

function collectImages($: any, container: any): string[] {
  const images: string[] = [];
  $(container).find('.skin img').each((_: any, img: any) => {
    const dataSrc = $(img).attr('data-src');
    const src = $(img).attr('src');
    const chosen = dataSrc || src;
    console.log(`[collectImages] .skin img: data-src=${dataSrc}, src=${src}, chosen=${chosen}`);
    if (chosen) images.push(restoreImageLink(chosen, true));
  });
  if (images.length === 0) {
    console.log(`[collectImages] no .skin img found, falling back to all img`);
    $(container).find('img').each((_: any, img: any) => {
      const dataSrc = $(img).attr('data-src');
      const src = $(img).attr('src');
      const chosen = dataSrc || src;
      console.log(`[collectImages] fallback img: data-src=${dataSrc}, src=${src}, chosen=${chosen}`);
      if (chosen) images.push(restoreImageLink(chosen, true));
    });
  }
  return images;
}

async function fetchImageData(pageTitle: string): Promise<{ groups: SkinGroup[], link: string }> {
  const link = `${BASE_WIKI}/wiki/${encodeURI(pageTitle)}`;
  const res = await fetch(link, { method: 'GET' });
  const body = await res.text();
  const $ = load(body);
  const groups: SkinGroup[] = [];

  const outerPanels = $('.tabber__panel').filter((_: any, el: any) =>
    $(el).parent().closest('.tabber__panel').length === 0 &&
    ($(el).find('.skin-box-contents').length > 0 || $(el).find('.skin').length > 0)
  );

  console.log(`[fetchImageData] outerPanels count: ${outerPanels.length}`);

  if (outerPanels.length > 0) {
    outerPanels.each((_: any, panel: any) => {
      const labelId = $(panel).attr('aria-labelledby');
      let skinName = pageTitle;
      if (labelId) {
        const label = $(`[id="${labelId}"]`).text().trim();
        if (label) skinName = label;
      }
      const hasContents = $(panel).find('.skin-box-contents').length > 0;
      console.log(`[fetchImageData] panel "${skinName}" (labelId=${labelId}): hasContents=${hasContents}`);
      if (hasContents) {
        $(panel).find('.skin-box-skin-list').each((listIdx: number, skinList: any) => {
          const groupLabel = listIdx === 0 ? skinName : `${skinName} (Damaged)`;
          const images = collectImages($, skinList);
          console.log(`[fetchImageData] skin-box-skin-list[${listIdx}] "${groupLabel}": ${images.length} images`);
          if (images.length > 0) groups.push({ label: groupLabel, images });
        });
      } else {
        const images = collectImages($, panel);
        console.log(`[image] simple panel "${skinName}": ${images.length} images`, images);
        if (images.length > 0) groups.push({ label: skinName, images });
      }
    });
  } else {
    $('.skin-box-contents').each((_: any, contents: any) => {
      $(contents).find('.skin-box-skin-list').each((listIdx: number, skinList: any) => {
        const groupLabel = listIdx === 0 ? pageTitle : `${pageTitle} (Damaged)`;
        const images = collectImages($, skinList);
        if (images.length > 0) groups.push({ label: groupLabel, images });
      });
    });
  }

  return { groups, link };
}

export default class ImageCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'image',
      description: "Search unit's images",
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

    try {
      let { groups, link } = await fetchImageData(unit);

      let fallbackTitle: string | null = null;
      if (groups.length === 0) {
        const searchResults = await wikiSearch(text);
        for (const title of searchResults) {
          const fallback = await fetchImageData(title);
          if (fallback.groups.length > 0) {
            groups = fallback.groups;
            link = fallback.link;
            fallbackTitle = title;
            break;
          }
        }
      }

      if (groups.length === 0) return await ctx.send("Can't find anything");
      if (fallbackTitle) await ctx.send(`_No exact match found. Showing results for **${fallbackTitle}**:_`);

      console.log(`[image] groups(${groups.length}):`, groups.map(g => `${g.label}(${g.images.length})`).join(', '));

      const pages: MessageEmbedOptions[][] = [];
      for (const group of groups) {
        for (let i = 0; i < group.images.length; i += 4) {
          const chunk = group.images.slice(i, i + 4);
          const chunkLabel = group.images.length > 4
            ? `${group.label} (${Math.floor(i / 4) + 1}/${Math.ceil(group.images.length / 4)})`
            : group.label;
          pages.push(chunk.map((imgUrl, idx) => {
            const embed: MessageEmbedOptions = { url: link, image: { url: imgUrl } };
            if (idx === 0) embed.title = chunkLabel;
            return embed;
          }));
        }
      }

      if (pages.length === 1) {
        await ctx.send({ embeds: pages[0] });
        return;
      }

      let page = 0;

      const buildEmbeds = () => {
        console.log(`[image] building page ${page + 1}/${pages.length}:`, pages[page]?.map(e => e.image?.url));
        const embeds = pages[page].map(e => ({ ...e }));
        embeds[0] = { ...embeds[0], footer: { text: `Page ${page + 1} of ${pages.length}` } };
        return embeds;
      };

      const jumpSelect: AnySelectComponent = {
        type: ComponentType.STRING_SELECT,
        custom_id: 'img_jump',
        placeholder: 'Jump to a skin',
        options: pages.map((pageEmbeds, idx) => ({
          label: (pageEmbeds[0].title || `Page ${idx + 1}`).slice(0, 100),
          value: String(idx)
        }))
      };

      const buildRows = (): ComponentActionRow[] => [
        {
          type: ComponentType.ACTION_ROW,
          components: [jumpSelect]
        },
        {
          type: ComponentType.ACTION_ROW,
          components: [
            {
              type: ComponentType.BUTTON,
              custom_id: 'img_first',
              label: '',
              emoji: { name: '⏮️' },
              style: ButtonStyle.SECONDARY,
              disabled: page === 0
            } as AnyComponentButton,
            {
              type: ComponentType.BUTTON,
              custom_id: 'img_prev',
              label: '',
              emoji: { name: '⬅️' },
              style: ButtonStyle.SECONDARY,
              disabled: page === 0
            } as AnyComponentButton,
            {
              type: ComponentType.BUTTON,
              custom_id: 'img_next',
              label: '',
              emoji: { name: '➡️' },
              style: ButtonStyle.SECONDARY,
              disabled: page === pages.length - 1
            } as AnyComponentButton,
            {
              type: ComponentType.BUTTON,
              custom_id: 'img_last',
              label: '',
              emoji: { name: '⏭️' },
              style: ButtonStyle.SECONDARY,
              disabled: page === pages.length - 1
            } as AnyComponentButton
          ]
        }
      ];

      await ctx.send({ embeds: pages[0], components: buildRows() });

      try {
        ctx.registerComponent('img_first', async (btnCtx) => {
          page = 0;
          await btnCtx.editOriginal({ embeds: buildEmbeds(), components: buildRows() });
        });
        ctx.registerComponent('img_prev', async (btnCtx) => {
          if (page > 0) page--;
          await btnCtx.editOriginal({ embeds: buildEmbeds(), components: buildRows() });
        });
        ctx.registerComponent('img_next', async (btnCtx) => {
          if (page < pages.length - 1) page++;
          await btnCtx.editOriginal({ embeds: buildEmbeds(), components: buildRows() });
        });
        ctx.registerComponent('img_last', async (btnCtx) => {
          page = pages.length - 1;
          await btnCtx.editOriginal({ embeds: buildEmbeds(), components: buildRows() });
        });
        ctx.registerComponent('img_jump', async (selectCtx) => {
          page = Number(selectCtx.values[0]);
          await selectCtx.editOriginal({ embeds: buildEmbeds(), components: buildRows() });
        });
      } catch {
        return;
      }
    } catch (err) {
      await ctx.send("Can't find anything");
      console.log(err);
    }
  }
}

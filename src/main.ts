import "./style.css";
import { definePluginContext } from "@ciderapp/pluginkit";
import PluginConfig from "./plugin.config";

const { plugin } = definePluginContext({
  ...PluginConfig,
  setup() {
    function parseColorStr(str: string): [number, number, number] {
      str = str.trim();
      if (str.startsWith('#')) {
          let hex = str.replace(/^#/, '');
          if (hex.length === 3) hex = [...hex].map(c => c + c).join('');
          const num = Number.parseInt(hex, 16);
          return [num >> 16, (num >> 8) & 255, num & 255];
      }
      const match = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) return [Number.parseInt(match[1]), Number.parseInt(match[2]), Number.parseInt(match[3])];
      return [255, 0, 0];
    }

    let lastNpBgColorStr = '';
    let lastArtworkBgColorStr = '';

    const observer = new MutationObserver(() => {
      const npEl = document.querySelector('[style*="--nowPlaying-bgColor"]');
      if (npEl) {
          let npBgColorStr = getComputedStyle(npEl).getPropertyValue('--nowPlaying-bgColor').trim();
          
          if (!npBgColorStr || npBgColorStr === 'transparent' || npBgColorStr === 'rgba(0, 0, 0, 0)') {
              npBgColorStr = '#ff2654';
          }

          if (npBgColorStr !== lastNpBgColorStr) {
              lastNpBgColorStr = npBgColorStr;
              
              const [bgR, bgG, bgB] = parseColorStr(npBgColorStr);
              const bgBrightness = (bgR * 299 + bgG * 587 + bgB * 114) / 1000;

              const chosenColorStr = (bgBrightness > 230 || bgBrightness < 60)
                  ? getComputedStyle(npEl).getPropertyValue('--nowPlaying-textColor1').trim()
                  : npBgColorStr;

              let [r, g, b] = parseColorStr(chosenColorStr || npBgColorStr);
              const brightness = (r * 299 + g * 587 + b * 114) / 1000;

              if (brightness > 200) {
                  const factor = 200 / brightness;
                  r = Math.round(r * factor);
                  g = Math.round(g * factor);
                  b = Math.round(b * factor);
              } else if (brightness < 100) {
                  const factor = 100 / Math.max(brightness, 1);
                  r = Math.min(255, Math.round(r * factor));
                  g = Math.min(255, Math.round(g * factor));
                  b = Math.min(255, Math.round(b * factor));
              }

              const base = [r, g, b];
              
              const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
              const adjust = (baseColor: number[], amount: number) => [
                  clamp(baseColor[0]+amount), 
                  clamp(baseColor[1]+amount), 
                  clamp(baseColor[2]+amount)
              ];
              const mixWhite = (baseColor: number[], ratio: number) => [
                  clamp(baseColor[0] + (255 - baseColor[0]) * ratio),
                  clamp(baseColor[1] + (255 - baseColor[1]) * ratio),
                  clamp(baseColor[2] + (255 - baseColor[2]) * ratio)
              ];
              const toRgbStr = (c: number[]) => `${c[0]}, ${c[1]}, ${c[2]}`;
              const toHexStr = (c: number[]) => "#" + c.map(x => x.toString(16).padStart(2, '0')).join('');

              const rollover = adjust(base, 50);
              const pressed = adjust(base, 25);
              const deepPressed = rollover;
              
              const icBase = mixWhite(base, 0.2);
              const icRollover = adjust(icBase, 50);
              const icPressed = adjust(icBase, 25);
              const icDeepPressed = icRollover;

              const rootStyle = document.body.style;
              
              rootStyle.setProperty('--keyColor', toHexStr(base));
              rootStyle.setProperty('--keyColor-rgb', toRgbStr(base));
              rootStyle.setProperty('--keyColor-rollover', toHexStr(rollover));
              rootStyle.setProperty('--keyColor-rollover-rgb', toRgbStr(rollover));
              rootStyle.setProperty('--keyColor-pressed', toHexStr(pressed));
              rootStyle.setProperty('--keyColor-pressed-rgb', toRgbStr(pressed));
              rootStyle.setProperty('--keyColor-deepPressed', toHexStr(deepPressed));
              rootStyle.setProperty('--keyColor-deepPressed-rgb', toRgbStr(deepPressed));
              rootStyle.setProperty('--keyColor-disabled', `rgba(${toRgbStr(base)}, .35)`);
              
              rootStyle.setProperty('--keyColor-default_IC', toHexStr(icBase));
              rootStyle.setProperty('--keyColor-default_IC-rgb', toRgbStr(icBase));
              rootStyle.setProperty('--keyColor-rollover_IC', toHexStr(icRollover));
              rootStyle.setProperty('--keyColor-rollover_IC-rgb', toRgbStr(icRollover));
              rootStyle.setProperty('--keyColor-pressed_IC', toHexStr(icPressed));
              rootStyle.setProperty('--keyColor-pressed_IC-rgb', toRgbStr(icPressed));
              rootStyle.setProperty('--keyColor-deepPressed_IC', toHexStr(icDeepPressed));
              rootStyle.setProperty('--keyColor-deepPressed_IC-rgb', toRgbStr(icDeepPressed));
              rootStyle.setProperty('--keyColor-disabled_IC', `rgba(${toRgbStr(icBase)}, .35)`);

              rootStyle.setProperty('--adaptiveAccent', toHexStr(base));

              const htmlStyle = document.documentElement.style;
              htmlStyle.setProperty('--musicKeyColor', toHexStr(base));
              htmlStyle.setProperty('--musicKeyColor-rgb', toRgbStr(base));
              htmlStyle.setProperty('--musicKeyColor-rollover', toHexStr(rollover));
              htmlStyle.setProperty('--musicKeyColor-rollover-rgb', toRgbStr(rollover));
              htmlStyle.setProperty('--musicKeyColor-pressed', toHexStr(pressed));
              htmlStyle.setProperty('--musicKeyColor-pressed-rgb', toRgbStr(pressed));
              htmlStyle.setProperty('--musicKeyColor-deepPressed', toHexStr(deepPressed));
              htmlStyle.setProperty('--musicKeyColor-deepPressed-rgb', toRgbStr(deepPressed));
              htmlStyle.setProperty('--musicKeyColor-disabled', `rgba(${toRgbStr(base)}, .35)`);
          }
      }

      const artworkEl = document.querySelector('.artwork[data-v-45e2c6a1]');
      if (artworkEl) {
          let artworkBgColorStr = getComputedStyle(artworkEl).getPropertyValue('--bgColor').trim();
          
          if (!artworkBgColorStr || artworkBgColorStr === 'transparent' || artworkBgColorStr === 'rgba(0, 0, 0, 0)') {
              artworkBgColorStr = '#ff2654';
          }

          if (artworkBgColorStr !== lastArtworkBgColorStr) {
              lastArtworkBgColorStr = artworkBgColorStr;
              document.body.style.setProperty('--buttonColor', artworkBgColorStr);
              document.documentElement.style.setProperty('--buttonColor', artworkBgColorStr);

              let [r, g, b] = parseColorStr(artworkBgColorStr);
              let brightness = (r * 299 + g * 587 + b * 114) / 1000;
              let textColor = brightness > 150 ? '#000000' : '#ffffff';
              
              document.body.style.setProperty('--buttonTextColor', textColor);
              document.documentElement.style.setProperty('--buttonTextColor', textColor);
          }
      }
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['style']
    });
  },
});

export default plugin;

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
          if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
          const num = parseInt(hex, 16);
          return [num >> 16, (num >> 8) & 255, num & 255];
      }
      const match = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
      return [255, 0, 0];
    }

    const observer = new MutationObserver(() => {
      const el = document.querySelector('[style*="--nowPlaying-bgColor"]');
      if (!el) return;

      const bgColorStr = getComputedStyle(el).getPropertyValue('--nowPlaying-bgColor').trim();
      if (!bgColorStr) return;

      let [bgR, bgG, bgB] = parseColorStr(bgColorStr);
      let bgBrightness = (bgR * 299 + bgG * 587 + bgB * 114) / 1000;

      const chosenColorStr = bgBrightness < 100
          ? getComputedStyle(el).getPropertyValue('--nowPlaying-textColor1').trim()
          : bgColorStr;

      let [r, g, b] = parseColorStr(chosenColorStr || bgColorStr);
      let brightness = (r * 299 + g * 587 + b * 114) / 1000;

      if (brightness > 200) {
          const factor = 200 / brightness;
          r = Math.round(r * factor);
          g = Math.round(g * factor);
          b = Math.round(b * factor);
      } else if (brightness < 60) {
          const factor = 60 / Math.max(brightness, 1);
          if (brightness === 0) { r=60; g=60; b=60; }
          else {
              r = Math.min(255, Math.round(r * factor));
              g = Math.min(255, Math.round(g * factor));
              b = Math.min(255, Math.round(b * factor));
          }
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
    });

    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['style']
    });
  },
});

export default plugin;

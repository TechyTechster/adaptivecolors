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

    function getAverageColor(img: HTMLImageElement): [number, number, number] | null {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      const width = canvas.width = img.naturalWidth || img.width || 100;
      const height = canvas.height = img.naturalHeight || img.height || 100;
      
      ctx.drawImage(img, 0, 0, width, height);
      
      try {
          const data = ctx.getImageData(0, 0, width, height).data;
          let r = 0, g = 0, b = 0, count = 0;
          
          for (let i = 0; i < data.length; i += 16) {
              if (data[i + 3] > 0) {
                  r += data[i];
                  g += data[i + 1];
                  b += data[i + 2];
                  count++;
              }
          }
          if (count === 0) return null;
          return [Math.round(r / count), Math.round(g / count), Math.round(b / count)];
      } catch (e) {
          console.warn("Canvas tainted, couldn't extract color", e);
          return null;
      }
    }

    let lastNpBgColorStr = '';
    let lastArtworkBgColorStr = '';
    let lastExtractedImgSrc = '';
    let lastLoadingImgSrc = '';

    let rafId: number | null = null;
    const observer = new MutationObserver(() => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        let npBgColorStr = '';
        const npEl = document.querySelector('[style*="--nowPlaying-bgColor"]');
        if (npEl) {
            npBgColorStr = getComputedStyle(npEl).getPropertyValue('--nowPlaying-bgColor').trim();
        }
        
        if (!npBgColorStr || npBgColorStr === 'transparent' || npBgColorStr === 'rgba(0, 0, 0, 0)') {
            const artworkImg = document.querySelector('.player-artwork img') as HTMLImageElement;
            if (artworkImg) {
                if (artworkImg.complete && artworkImg.naturalWidth > 0) {
                    if (artworkImg.src !== lastExtractedImgSrc) {
                        const avgColor = getAverageColor(artworkImg);
                        if (avgColor) {
                            npBgColorStr = `rgb(${avgColor[0]}, ${avgColor[1]}, ${avgColor[2]})`;
                            lastExtractedImgSrc = artworkImg.src;
                        } else {
                            npBgColorStr = '#ff2654';
                        }
                    } else {
                        npBgColorStr = lastNpBgColorStr || '#ff2654';
                    }
                } else {
                    if (artworkImg.src !== lastLoadingImgSrc) {
                        lastLoadingImgSrc = artworkImg.src;
                        artworkImg.addEventListener('load', () => {
                            document.body.style.setProperty('--force-color-update', Date.now().toString());
                        }, { once: true });
                    }
                    npBgColorStr = lastNpBgColorStr || '#ff2654';
                }
            } else {
                npBgColorStr = '#ff2654';
            }
        }

        if (npBgColorStr !== lastNpBgColorStr) {
              lastNpBgColorStr = npBgColorStr;
              
              const [bgR, bgG, bgB] = parseColorStr(npBgColorStr);
              const bgBrightness = (bgR * 299 + bgG * 587 + bgB * 114) / 1000;

              const chosenColorStr = (bgBrightness > 230 || bgBrightness < 60)
                  ? (npEl ? getComputedStyle(npEl).getPropertyValue('--nowPlaying-textColor1').trim() : npBgColorStr)
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

      const artworkEl = document.querySelector('.artwork');
      if (artworkEl) {
          let artworkBgColorStr = getComputedStyle(artworkEl).getPropertyValue('--bgColor').trim();
          
          if (!artworkBgColorStr || artworkBgColorStr === 'transparent' || artworkBgColorStr === 'rgba(0, 0, 0, 0)') {
              artworkBgColorStr = '#ff2654';
          }

          if (artworkBgColorStr !== lastArtworkBgColorStr) {
              lastArtworkBgColorStr = artworkBgColorStr;
              document.body.style.setProperty('--buttonColor', artworkBgColorStr);
              document.documentElement.style.setProperty('--buttonColor', artworkBgColorStr);

              const [r, g, b] = parseColorStr(artworkBgColorStr);
              const brightness = (r * 299 + g * 587 + b * 114) / 1000;
              const textColor = brightness > 150 ? '#000000' : '#ffffff';
              
              document.body.style.setProperty('--buttonTextColor', textColor);
              document.documentElement.style.setProperty('--buttonTextColor', textColor);
          }
      }
      });
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

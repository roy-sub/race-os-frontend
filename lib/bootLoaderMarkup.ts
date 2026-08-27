// Verbatim markup from the Claude Design handoff (RaceOS Landing.dc.html lines 53-491).
// Hand-tuned 24-frame Muybridge gait cycle + secondary progress loader; kept as raw markup
// to preserve exact fidelity of the biomechanically-verified animation frames.
export const bootLoaderMarkup = `
  <div id="om-boot" aria-hidden="true">
    <div class="gate"><div class="strip">
        <svg width="99" height="99" viewBox="0 0 99 99" style="display:block;flex:none;">
          <g fill="none" stroke="#FBF8F2" stroke-linecap="round" stroke-linejoin="round">
            <g stroke-width="1.6" stroke-opacity=".4"><path d="M45.0 37.8 L49.3 47.4 L58.3 43.6"></path><path d="M45.0 58.8 L40.4 73.1 L26.1 74.1"></path><path d="M26.1 74.1 L25.4 79.3"></path></g>
            <circle cx="45.0" cy="28.1" r="6.3" stroke-width="1.8"></circle>
            <path d="M45.0 58.8 L45.0 37.8" stroke-width="1.8"></path>
            <g stroke-width="1.8"><path d="M45.0 58.8 L51.3 72.4 L53.1 86.5"></path><path d="M53.1 86.5 L58.3 87.0"></path><path d="M45.0 37.8 L40.7 47.4 L47.3 54.5"></path></g>
          </g>
          <path d="M12 93.0 L29 93.0" stroke="#E4622F" stroke-width="1.8" stroke-linecap="round" opacity=".85"></path>
          <g stroke="#FBF8F2" stroke-width="1.2" stroke-linecap="round" stroke-opacity=".13">
            <path d="M19 42.8 L5 42.8"></path>
            <path d="M23 60.8 L9 60.8"></path>
          </g>
        </svg>
        <svg width="99" height="99" viewBox="0 0 99 99" style="display:block;flex:none;">
          <g fill="none" stroke="#FBF8F2" stroke-linecap="round" stroke-linejoin="round">
            <g stroke-width="1.6" stroke-opacity=".4"><path d="M45.0 36.7 L48.2 46.7 L57.7 44.4"></path><path d="M45.0 57.7 L41.8 72.3 L27.8 70.0"></path><path d="M27.8 70.0 L25.8 74.8"></path></g>
            <circle cx="45.0" cy="26.9" r="6.3" stroke-width="1.8"></circle>
            <path d="M45.0 57.7 L45.0 36.7" stroke-width="1.8"></path>
            <g stroke-width="1.8"><path d="M45.0 57.7 L50.5 71.6 L50.4 85.9"></path><path d="M50.4 85.9 L55.5 87.0"></path><path d="M45.0 36.7 L41.4 46.5 L48.7 53.0"></path></g>
          </g>
          <path d="M12 93.0 L29 93.0" stroke="#E4622F" stroke-width="1.8" stroke-linecap="round" opacity=".85"></path>
          <g stroke="#FBF8F2" stroke-width="1.2" stroke-linecap="round" stroke-opacity=".13">
            <path d="M19 41.7 L5 41.7"></path>
            <path d="M23 59.7 L9 59.7"></path>
          </g>
        </svg>
        <svg width="99" height="99" viewBox="0 0 99 99" style="display:block;flex:none;">
          <g fill="none" stroke="#FBF8F2" stroke-linecap="round" stroke-linejoin="round">
            <g stroke-width="1.6" stroke-opacity=".4"><path d="M45.0 35.6 L46.7 45.9 L56.5 45.6"></path><path d="M45.0 56.6 L43.7 71.5 L30.2 67.0"></path><path d="M30.2 67.0 L27.5 71.5"></path></g>
            <circle cx="45.0" cy="25.8" r="6.3" stroke-width="1.8"></circle>
            <path d="M45.0 56.6 L45.0 35.6" stroke-width="1.8"></path>
            <g stroke-width="1.8"><path d="M45.0 56.6 L49.5 70.9 L46.1 84.7"></path><path d="M46.1 84.7 L50.8 87.0"></path><path d="M45.0 35.6 L42.1 45.7 L50.1 51.3"></path></g>
          </g>
          <path d="M12 93.0 L29 93.0" stroke="#E4622F" stroke-width="1.8" stroke-linecap="round" opacity=".85"></path>
          <g stroke="#FBF8F2" stroke-width="1.2" stroke-linecap="round" stroke-opacity=".13">
            <path d="M19 40.6 L5 40.6"></path>
            <path d="M23 58.6 L9 58.6"></path>
          </g>
        </svg>
        <svg width="99" height="99" viewBox="0 0 99 99" style="display:block;flex:none;">
          <g fill="none" stroke="#FBF8F2" stroke-linecap="round" stroke-linejoin="round">
            <g stroke-width="1.6" stroke-opacity=".4"><path d="M45.0 35.3 L45.1 45.8 L54.7 47.7"></path><path d="M45.0 56.3 L45.8 71.3 L32.3 66.6"></path><path d="M32.3 66.6 L29.6 71.1"></path></g>
            <circle cx="45.0" cy="25.5" r="6.3" stroke-width="1.8"></circle>
            <path d="M45.0 56.3 L45.0 35.3" stroke-width="1.8"></path>
            <g stroke-width="1.8"><path d="M45.0 56.3 L48.6 70.9 L43.1 84.0"></path><path d="M43.1 84.0 L47.5 87.0"></path><path d="M45.0 35.3 L42.9 45.6 L51.4 50.3"></path></g>
          </g>
          <path d="M12 93.0 L29 93.0" stroke="#E4622F" stroke-width="1.8" stroke-linecap="round" opacity=".85"></path>
          <g stroke="#FBF8F2" stroke-width="1.2" stroke-linecap="round" stroke-opacity=".13">
            <path d="M19 40.3 L5 40.3"></path>
            <path d="M23 58.3 L9 58.3"></path>
          </g>
        </svg>
        <svg width="99" height="99" viewBox="0 0 99 99" style="display:block;flex:none;">
          <g fill="none" stroke="#FBF8F2" stroke-linecap="round" stroke-linejoin="round">
            <g stroke-width="1.6" stroke-opacity=".4"><path d="M45.0 35.3 L43.3 45.6 L52.1 49.8"></path><path d="M45.0 56.3 L48.1 71.0 L34.1 67.9"></path><path d="M34.1 67.9 L32.0 72.7"></path></g>
            <circle cx="45.0" cy="25.5" r="6.3" stroke-width="1.8"></circle>
            <path d="M45.0 56.3 L45.0 35.3" stroke-width="1.8"></path>
            <g stroke-width="1.8"><path d="M45.0 56.3 L47.6 71.1 L40.8 83.6"></path><path d="M40.8 83.6 L44.8 87.0"></path><path d="M45.0 35.3 L43.7 45.7 L52.7 49.4"></path></g>
          </g>
          <path d="M12 93.0 L29 93.0" stroke="#E4622F" stroke-width="1.8" stroke-linecap="round" opacity=".85"></path>
          <g stroke="#FBF8F2" stroke-width="1.2" stroke-linecap="round" stroke-opacity=".13">
            <path d="M19 40.3 L5 40.3"></path>
            <path d="M23 58.3 L9 58.3"></path>
          </g>
        </svg>
        <svg width="99" height="99" viewBox="0 0 99 99" style="display:block;flex:none;">
          <g fill="none" stroke="#FBF8F2" stroke-linecap="round" stroke-linejoin="round">
            <g stroke-width="1.6" stroke-opacity=".4"><path d="M45.0 35.4 L41.8 45.4 L49.5 51.3"></path><path d="M45.0 56.4 L50.0 70.5 L35.7 70.1"></path><path d="M35.7 70.1 L34.5 75.2"></path></g>
            <circle cx="45.0" cy="25.6" r="6.3" stroke-width="1.8"></circle>
            <path d="M45.0 56.4 L45.0 35.4" stroke-width="1.8"></path>
            <g stroke-width="1.8"><path d="M45.0 56.4 L46.2 71.3 L38.5 83.3"></path><path d="M38.5 83.3 L42.3 87.0"></path><path d="M45.0 35.4 L44.7 45.9 L54.2 48.2"></path></g>
          </g>
          <path d="M12 93.0 L29 93.0" stroke="#E4622F" stroke-width="1.8" stroke-linecap="round" opacity=".85"></path>
          <g stroke="#FBF8F2" stroke-width="1.2" stroke-linecap="round" stroke-opacity=".13">
            <path d="M19 40.4 L5 40.4"></path>
            <path d="M23 58.4 L9 58.4"></path>
          </g>
        </svg>
        <svg width="99" height="99" viewBox="0 0 99 99" style="display:block;flex:none;">
          <g fill="none" stroke="#FBF8F2" stroke-linecap="round" stroke-linejoin="round">
            <g stroke-width="1.6" stroke-opacity=".4"><path d="M45.0 35.6 L40.7 45.1 L47.2 52.3"></path><path d="M45.0 56.6 L51.4 70.1 L37.5 73.2"></path><path d="M37.5 73.2 L37.5 78.5"></path></g>
            <circle cx="45.0" cy="25.8" r="6.3" stroke-width="1.8"></circle>
            <path d="M45.0 56.6 L45.0 35.6" stroke-width="1.8"></path>
            <g stroke-width="1.8"><path d="M45.0 56.6 L44.2 71.5 L35.9 83.1"></path><path d="M35.9 83.1 L39.5 87.0"></path><path d="M45.0 35.6 L46.3 46.0 L56.0 46.3"></path></g>
          </g>
          <path d="M12 93.0 L29 93.0" stroke="#E4622F" stroke-width="1.8" stroke-linecap="round" opacity=".85"></path>
          <g stroke="#FBF8F2" stroke-width="1.2" stroke-linecap="round" stroke-opacity=".13">
            <path d="M19 40.6 L5 40.6"></path>
            <path d="M23 58.6 L9 58.6"></path>
          </g>
        </svg>
        <svg width="99" height="99" viewBox="0 0 99 99" style="display:block;flex:none;">
          <g fill="none" stroke="#FBF8F2" stroke-linecap="round" stroke-linejoin="round">
            <g stroke-width="1.6" stroke-opacity=".4"><path d="M45.0 36.0 L39.9 45.1 L45.6 53.1"></path><path d="M45.0 57.0 L52.4 70.0 L39.9 76.9"></path><path d="M39.9 76.9 L41.4 81.9"></path></g>
            <circle cx="45.0" cy="26.2" r="6.3" stroke-width="1.8"></circle>
            <path d="M45.0 57.0 L45.0 36.0" stroke-width="1.8"></path>
            <g stroke-width="1.8"><path d="M45.0 57.0 L42.2 71.7 L33.5 83.0"></path><path d="M33.5 83.0 L36.9 87.0"></path><path d="M45.0 36.0 L47.9 46.1 L57.4 44.2"></path></g>
          </g>
          <path d="M12 93.0 L29 93.0" stroke="#E4622F" stroke-width="1.8" stroke-linecap="round" opacity=".85"></path>
          <g stroke="#FBF8F2" stroke-width="1.2" stroke-linecap="round" stroke-opacity=".13">
            <path d="M19 41.0 L5 41.0"></path>
            <path d="M23 59.0 L9 59.0"></path>
          </g>
        </svg>
        <svg width="99" height="99" viewBox="0 0 99 99" style="display:block;flex:none;">
          <g fill="none" stroke="#FBF8F2" stroke-linecap="round" stroke-linejoin="round">
            <g stroke-width="1.6" stroke-opacity=".4"><path d="M45.0 36.4 L39.6 45.4 L44.9 53.5"></path><path d="M45.0 57.4 L52.7 70.2 L42.8 80.4"></path><path d="M42.8 80.4 L45.7 84.8"></path></g>
            <circle cx="45.0" cy="26.6" r="6.3" stroke-width="1.8"></circle>
            <path d="M45.0 57.4 L45.0 36.4" stroke-width="1.8"></path>
            <g stroke-width="1.8"><path d="M45.0 57.4 L40.6 71.7 L31.9 83.0"></path><path d="M31.9 83.0 L35.4 87.0"></path><path d="M45.0 36.4 L49.1 46.0 L58.2 42.4"></path></g>
          </g>
          <path d="M12 93.0 L29 93.0" stroke="#E4622F" stroke-width="1.8" stroke-linecap="round" opacity=".85"></path>
          <g stroke="#FBF8F2" stroke-width="1.2" stroke-linecap="round" stroke-opacity=".13">
            <path d="M19 41.4 L5 41.4"></path>
            <path d="M23 59.4 L9 59.4"></path>
          </g>
        </svg>
        <svg width="99" height="99" viewBox="0 0 99 99" style="display:block;flex:none;">
          <g fill="none" stroke="#FBF8F2" stroke-linecap="round" stroke-linejoin="round">
            <g stroke-width="1.6" stroke-opacity=".4"><path d="M45.0 36.7 L39.7 45.8 L45.1 53.9"></path><path d="M45.0 57.7 L52.6 70.7 L46.2 83.3"></path><path d="M46.2 83.3 L50.2 86.7"></path></g>
            <circle cx="45.0" cy="27.0" r="6.3" stroke-width="1.8"></circle>
            <path d="M45.0 57.7 L45.0 36.7" stroke-width="1.8"></path>
            <g stroke-width="1.8"><path d="M45.0 57.7 L39.3 71.6 L30.8 83.1"></path><path d="M30.8 83.1 L34.3 87.0"></path><path d="M45.0 36.7 L50.1 45.9 L58.5 41.0"></path></g>
          </g>
          <path d="M12 93.0 L29 93.0" stroke="#E4622F" stroke-width="1.8" stroke-linecap="round" opacity=".85"></path>
          <g stroke="#FBF8F2" stroke-width="1.2" stroke-linecap="round" stroke-opacity=".13">
            <path d="M19 41.7 L5 41.7"></path>
            <path d="M23 59.7 L9 59.7"></path>
          </g>
        </svg>
        <svg width="99" height="99" viewBox="0 0 99 99" style="display:block;flex:none;">
          <g fill="none" stroke="#FBF8F2" stroke-linecap="round" stroke-linejoin="round">
            <g stroke-width="1.6" stroke-opacity=".4"><path d="M45.0 36.0 L39.9 45.2 L45.6 53.1"></path><path d="M45.0 57.0 L52.4 70.1 L49.3 84.0"></path><path d="M49.3 84.0 L54.1 86.2"></path></g>
            <circle cx="45.0" cy="26.3" r="6.3" stroke-width="1.8"></circle>
            <path d="M45.0 57.0 L45.0 36.0" stroke-width="1.8"></path>
            <g stroke-width="1.8"><path d="M45.0 57.0 L38.9 70.7 L28.7 80.7"></path><path d="M28.7 80.7 L31.5 85.1"></path><path d="M45.0 36.0 L50.4 45.0 L58.6 39.7"></path></g>
          </g>
          <path d="M12 93.0 L29 93.0" stroke="#E4622F" stroke-width="1.8" stroke-linecap="round" opacity=".85"></path>
          <g stroke="#FBF8F2" stroke-width="1.2" stroke-linecap="round" stroke-opacity=".13">
            <path d="M19 41.0 L5 41.0"></path>
            <path d="M23 59.0 L9 59.0"></path>
          </g>
        </svg>
        <svg width="99" height="99" viewBox="0 0 99 99" style="display:block;flex:none;">
          <g fill="none" stroke="#FBF8F2" stroke-linecap="round" stroke-linejoin="round">
            <g stroke-width="1.6" stroke-opacity=".4"><path d="M45.0 35.1 L40.2 44.5 L46.3 52.1"></path><path d="M45.0 56.1 L52.0 69.4 L52.2 83.7"></path><path d="M52.2 83.7 L57.3 84.7"></path></g>
            <circle cx="45.0" cy="25.4" r="6.3" stroke-width="1.8"></circle>
            <path d="M45.0 56.1 L45.0 35.1" stroke-width="1.8"></path>
            <g stroke-width="1.8"><path d="M45.0 56.1 L39.4 70.0 L26.3 75.8"></path><path d="M26.3 75.8 L27.4 80.9"></path><path d="M45.0 35.1 L50.0 44.3 L58.5 39.5"></path></g>
          </g>
          <path d="M12 93.0 L29 93.0" stroke="#E4622F" stroke-width="1.8" stroke-linecap="round" opacity=".85"></path>
          <g stroke="#FBF8F2" stroke-width="1.2" stroke-linecap="round" stroke-opacity=".13">
            <path d="M19 40.1 L5 40.1"></path>
            <path d="M23 58.1 L9 58.1"></path>
          </g>
        </svg>
        <svg width="99" height="99" viewBox="0 0 99 99" style="display:block;flex:none;">
          <g fill="none" stroke="#FBF8F2" stroke-linecap="round" stroke-linejoin="round">
            <g stroke-width="1.6" stroke-opacity=".4"><path d="M45.0 37.8 L40.7 47.4 L47.3 54.5"></path><path d="M45.0 58.8 L51.3 72.4 L53.1 86.5"></path><path d="M53.1 86.5 L58.3 87.0"></path></g>
            <circle cx="45.0" cy="28.1" r="6.3" stroke-width="1.8"></circle>
            <path d="M45.0 58.8 L45.0 37.8" stroke-width="1.8"></path>
            <g stroke-width="1.8"><path d="M45.0 58.8 L40.4 73.1 L26.1 74.1"></path><path d="M26.1 74.1 L25.4 79.3"></path><path d="M45.0 37.8 L49.3 47.4 L58.3 43.6"></path></g>
          </g>
          <path d="M12 93.0 L29 93.0" stroke="#E4622F" stroke-width="1.8" stroke-linecap="round" opacity=".85"></path>
          <g stroke="#FBF8F2" stroke-width="1.2" stroke-linecap="round" stroke-opacity=".13">
            <path d="M19 42.8 L5 42.8"></path>
            <path d="M23 60.8 L9 60.8"></path>
          </g>
        </svg>
        <svg width="99" height="99" viewBox="0 0 99 99" style="display:block;flex:none;">
          <g fill="none" stroke="#FBF8F2" stroke-linecap="round" stroke-linejoin="round">
            <g stroke-width="1.6" stroke-opacity=".4"><path d="M45.0 36.7 L41.4 46.5 L48.7 53.0"></path><path d="M45.0 57.7 L50.5 71.6 L50.4 85.9"></path><path d="M50.4 85.9 L55.5 87.0"></path></g>
            <circle cx="45.0" cy="26.9" r="6.3" stroke-width="1.8"></circle>
            <path d="M45.0 57.7 L45.0 36.7" stroke-width="1.8"></path>
            <g stroke-width="1.8"><path d="M45.0 57.7 L41.8 72.3 L27.8 70.0"></path><path d="M27.8 70.0 L25.8 74.8"></path><path d="M45.0 36.7 L48.2 46.7 L57.7 44.4"></path></g>
          </g>
          <path d="M12 93.0 L29 93.0" stroke="#E4622F" stroke-width="1.8" stroke-linecap="round" opacity=".85"></path>
          <g stroke="#FBF8F2" stroke-width="1.2" stroke-linecap="round" stroke-opacity=".13">
            <path d="M19 41.7 L5 41.7"></path>
            <path d="M23 59.7 L9 59.7"></path>
          </g>
        </svg>
        <svg width="99" height="99" viewBox="0 0 99 99" style="display:block;flex:none;">
          <g fill="none" stroke="#FBF8F2" stroke-linecap="round" stroke-linejoin="round">
            <g stroke-width="1.6" stroke-opacity=".4"><path d="M45.0 35.6 L42.1 45.7 L50.1 51.3"></path><path d="M45.0 56.6 L49.5 70.9 L46.1 84.7"></path><path d="M46.1 84.7 L50.8 87.0"></path></g>
            <circle cx="45.0" cy="25.8" r="6.3" stroke-width="1.8"></circle>
            <path d="M45.0 56.6 L45.0 35.6" stroke-width="1.8"></path>
            <g stroke-width="1.8"><path d="M45.0 56.6 L43.7 71.5 L30.2 67.0"></path><path d="M30.2 67.0 L27.5 71.5"></path><path d="M45.0 35.6 L46.7 45.9 L56.5 45.6"></path></g>
          </g>
          <path d="M12 93.0 L29 93.0" stroke="#E4622F" stroke-width="1.8" stroke-linecap="round" opacity=".85"></path>
          <g stroke="#FBF8F2" stroke-width="1.2" stroke-linecap="round" stroke-opacity=".13">
            <path d="M19 40.6 L5 40.6"></path>
            <path d="M23 58.6 L9 58.6"></path>
          </g>
        </svg>
        <svg width="99" height="99" viewBox="0 0 99 99" style="display:block;flex:none;">
          <g fill="none" stroke="#FBF8F2" stroke-linecap="round" stroke-linejoin="round">
            <g stroke-width="1.6" stroke-opacity=".4"><path d="M45.0 35.3 L42.9 45.6 L51.4 50.3"></path><path d="M45.0 56.3 L48.6 70.9 L43.1 84.0"></path><path d="M43.1 84.0 L47.5 87.0"></path></g>
            <circle cx="45.0" cy="25.5" r="6.3" stroke-width="1.8"></circle>
            <path d="M45.0 56.3 L45.0 35.3" stroke-width="1.8"></path>
            <g stroke-width="1.8"><path d="M45.0 56.3 L45.8 71.3 L32.3 66.6"></path><path d="M32.3 66.6 L29.6 71.1"></path><path d="M45.0 35.3 L45.1 45.8 L54.7 47.7"></path></g>
          </g>
          <path d="M12 93.0 L29 93.0" stroke="#E4622F" stroke-width="1.8" stroke-linecap="round" opacity=".85"></path>
          <g stroke="#FBF8F2" stroke-width="1.2" stroke-linecap="round" stroke-opacity=".13">
            <path d="M19 40.3 L5 40.3"></path>
            <path d="M23 58.3 L9 58.3"></path>
          </g>
        </svg>
        <svg width="99" height="99" viewBox="0 0 99 99" style="display:block;flex:none;">
          <g fill="none" stroke="#FBF8F2" stroke-linecap="round" stroke-linejoin="round">
            <g stroke-width="1.6" stroke-opacity=".4"><path d="M45.0 35.3 L43.7 45.7 L52.7 49.4"></path><path d="M45.0 56.3 L47.6 71.1 L40.8 83.6"></path><path d="M40.8 83.6 L44.8 87.0"></path></g>
            <circle cx="45.0" cy="25.5" r="6.3" stroke-width="1.8"></circle>
            <path d="M45.0 56.3 L45.0 35.3" stroke-width="1.8"></path>
            <g stroke-width="1.8"><path d="M45.0 56.3 L48.1 71.0 L34.1 67.9"></path><path d="M34.1 67.9 L32.0 72.7"></path><path d="M45.0 35.3 L43.3 45.6 L52.1 49.8"></path></g>
          </g>
          <path d="M12 93.0 L29 93.0" stroke="#E4622F" stroke-width="1.8" stroke-linecap="round" opacity=".85"></path>
          <g stroke="#FBF8F2" stroke-width="1.2" stroke-linecap="round" stroke-opacity=".13">
            <path d="M19 40.3 L5 40.3"></path>
            <path d="M23 58.3 L9 58.3"></path>
          </g>
        </svg>
        <svg width="99" height="99" viewBox="0 0 99 99" style="display:block;flex:none;">
          <g fill="none" stroke="#FBF8F2" stroke-linecap="round" stroke-linejoin="round">
            <g stroke-width="1.6" stroke-opacity=".4"><path d="M45.0 35.4 L44.7 45.9 L54.2 48.2"></path><path d="M45.0 56.4 L46.2 71.3 L38.5 83.3"></path><path d="M38.5 83.3 L42.3 87.0"></path></g>
            <circle cx="45.0" cy="25.6" r="6.3" stroke-width="1.8"></circle>
            <path d="M45.0 56.4 L45.0 35.4" stroke-width="1.8"></path>
            <g stroke-width="1.8"><path d="M45.0 56.4 L50.0 70.5 L35.7 70.1"></path><path d="M35.7 70.1 L34.5 75.2"></path><path d="M45.0 35.4 L41.8 45.4 L49.5 51.3"></path></g>
          </g>
          <path d="M12 93.0 L29 93.0" stroke="#E4622F" stroke-width="1.8" stroke-linecap="round" opacity=".85"></path>
          <g stroke="#FBF8F2" stroke-width="1.2" stroke-linecap="round" stroke-opacity=".13">
            <path d="M19 40.4 L5 40.4"></path>
            <path d="M23 58.4 L9 58.4"></path>
          </g>
        </svg>
        <svg width="99" height="99" viewBox="0 0 99 99" style="display:block;flex:none;">
          <g fill="none" stroke="#FBF8F2" stroke-linecap="round" stroke-linejoin="round">
            <g stroke-width="1.6" stroke-opacity=".4"><path d="M45.0 35.6 L46.3 46.0 L56.0 46.3"></path><path d="M45.0 56.6 L44.2 71.5 L35.9 83.1"></path><path d="M35.9 83.1 L39.5 87.0"></path></g>
            <circle cx="45.0" cy="25.8" r="6.3" stroke-width="1.8"></circle>
            <path d="M45.0 56.6 L45.0 35.6" stroke-width="1.8"></path>
            <g stroke-width="1.8"><path d="M45.0 56.6 L51.4 70.1 L37.5 73.2"></path><path d="M37.5 73.2 L37.5 78.5"></path><path d="M45.0 35.6 L40.7 45.1 L47.2 52.3"></path></g>
          </g>
          <path d="M12 93.0 L29 93.0" stroke="#E4622F" stroke-width="1.8" stroke-linecap="round" opacity=".85"></path>
          <g stroke="#FBF8F2" stroke-width="1.2" stroke-linecap="round" stroke-opacity=".13">
            <path d="M19 40.6 L5 40.6"></path>
            <path d="M23 58.6 L9 58.6"></path>
          </g>
        </svg>
        <svg width="99" height="99" viewBox="0 0 99 99" style="display:block;flex:none;">
          <g fill="none" stroke="#FBF8F2" stroke-linecap="round" stroke-linejoin="round">
            <g stroke-width="1.6" stroke-opacity=".4"><path d="M45.0 36.0 L47.9 46.1 L57.4 44.2"></path><path d="M45.0 57.0 L42.2 71.7 L33.5 83.0"></path><path d="M33.5 83.0 L36.9 87.0"></path></g>
            <circle cx="45.0" cy="26.2" r="6.3" stroke-width="1.8"></circle>
            <path d="M45.0 57.0 L45.0 36.0" stroke-width="1.8"></path>
            <g stroke-width="1.8"><path d="M45.0 57.0 L52.4 70.0 L39.9 76.9"></path><path d="M39.9 76.9 L41.4 81.9"></path><path d="M45.0 36.0 L39.9 45.1 L45.6 53.1"></path></g>
          </g>
          <path d="M12 93.0 L29 93.0" stroke="#E4622F" stroke-width="1.8" stroke-linecap="round" opacity=".85"></path>
          <g stroke="#FBF8F2" stroke-width="1.2" stroke-linecap="round" stroke-opacity=".13">
            <path d="M19 41.0 L5 41.0"></path>
            <path d="M23 59.0 L9 59.0"></path>
          </g>
        </svg>
        <svg width="99" height="99" viewBox="0 0 99 99" style="display:block;flex:none;">
          <g fill="none" stroke="#FBF8F2" stroke-linecap="round" stroke-linejoin="round">
            <g stroke-width="1.6" stroke-opacity=".4"><path d="M45.0 36.4 L49.1 46.0 L58.2 42.4"></path><path d="M45.0 57.4 L40.6 71.7 L31.9 83.0"></path><path d="M31.9 83.0 L35.4 87.0"></path></g>
            <circle cx="45.0" cy="26.6" r="6.3" stroke-width="1.8"></circle>
            <path d="M45.0 57.4 L45.0 36.4" stroke-width="1.8"></path>
            <g stroke-width="1.8"><path d="M45.0 57.4 L52.7 70.2 L42.8 80.4"></path><path d="M42.8 80.4 L45.7 84.8"></path><path d="M45.0 36.4 L39.6 45.4 L44.9 53.5"></path></g>
          </g>
          <path d="M12 93.0 L29 93.0" stroke="#E4622F" stroke-width="1.8" stroke-linecap="round" opacity=".85"></path>
          <g stroke="#FBF8F2" stroke-width="1.2" stroke-linecap="round" stroke-opacity=".13">
            <path d="M19 41.4 L5 41.4"></path>
            <path d="M23 59.4 L9 59.4"></path>
          </g>
        </svg>
        <svg width="99" height="99" viewBox="0 0 99 99" style="display:block;flex:none;">
          <g fill="none" stroke="#FBF8F2" stroke-linecap="round" stroke-linejoin="round">
            <g stroke-width="1.6" stroke-opacity=".4"><path d="M45.0 36.7 L50.1 45.9 L58.5 41.0"></path><path d="M45.0 57.7 L39.3 71.6 L30.8 83.1"></path><path d="M30.8 83.1 L34.3 87.0"></path></g>
            <circle cx="45.0" cy="27.0" r="6.3" stroke-width="1.8"></circle>
            <path d="M45.0 57.7 L45.0 36.7" stroke-width="1.8"></path>
            <g stroke-width="1.8"><path d="M45.0 57.7 L52.6 70.7 L46.2 83.3"></path><path d="M46.2 83.3 L50.2 86.7"></path><path d="M45.0 36.7 L39.7 45.8 L45.1 53.9"></path></g>
          </g>
          <path d="M12 93.0 L29 93.0" stroke="#E4622F" stroke-width="1.8" stroke-linecap="round" opacity=".85"></path>
          <g stroke="#FBF8F2" stroke-width="1.2" stroke-linecap="round" stroke-opacity=".13">
            <path d="M19 41.7 L5 41.7"></path>
            <path d="M23 59.7 L9 59.7"></path>
          </g>
        </svg>
        <svg width="99" height="99" viewBox="0 0 99 99" style="display:block;flex:none;">
          <g fill="none" stroke="#FBF8F2" stroke-linecap="round" stroke-linejoin="round">
            <g stroke-width="1.6" stroke-opacity=".4"><path d="M45.0 36.0 L50.4 45.0 L58.6 39.7"></path><path d="M45.0 57.0 L38.9 70.7 L28.7 80.7"></path><path d="M28.7 80.7 L31.5 85.1"></path></g>
            <circle cx="45.0" cy="26.3" r="6.3" stroke-width="1.8"></circle>
            <path d="M45.0 57.0 L45.0 36.0" stroke-width="1.8"></path>
            <g stroke-width="1.8"><path d="M45.0 57.0 L52.4 70.1 L49.3 84.0"></path><path d="M49.3 84.0 L54.1 86.2"></path><path d="M45.0 36.0 L39.9 45.2 L45.6 53.1"></path></g>
          </g>
          <path d="M12 93.0 L29 93.0" stroke="#E4622F" stroke-width="1.8" stroke-linecap="round" opacity=".85"></path>
          <g stroke="#FBF8F2" stroke-width="1.2" stroke-linecap="round" stroke-opacity=".13">
            <path d="M19 41.0 L5 41.0"></path>
            <path d="M23 59.0 L9 59.0"></path>
          </g>
        </svg>
        <svg width="99" height="99" viewBox="0 0 99 99" style="display:block;flex:none;">
          <g fill="none" stroke="#FBF8F2" stroke-linecap="round" stroke-linejoin="round">
            <g stroke-width="1.6" stroke-opacity=".4"><path d="M45.0 35.1 L50.0 44.3 L58.5 39.5"></path><path d="M45.0 56.1 L39.4 70.0 L26.3 75.8"></path><path d="M26.3 75.8 L27.4 80.9"></path></g>
            <circle cx="45.0" cy="25.4" r="6.3" stroke-width="1.8"></circle>
            <path d="M45.0 56.1 L45.0 35.1" stroke-width="1.8"></path>
            <g stroke-width="1.8"><path d="M45.0 56.1 L52.0 69.4 L52.2 83.7"></path><path d="M52.2 83.7 L57.3 84.7"></path><path d="M45.0 35.1 L40.2 44.5 L46.3 52.1"></path></g>
          </g>
          <path d="M12 93.0 L29 93.0" stroke="#E4622F" stroke-width="1.8" stroke-linecap="round" opacity=".85"></path>
          <g stroke="#FBF8F2" stroke-width="1.2" stroke-linecap="round" stroke-opacity=".13">
            <path d="M19 40.1 L5 40.1"></path>
            <path d="M23 58.1 L9 58.1"></path>
          </g>
        </svg>
    </div></div>
    <div class="meter"><span></span></div>
    <div style="font-family:'JetBrains Mono',monospace;font-size:9.5px;letter-spacing:.32em;color:rgba(251,248,242,.42);">RACEOS</div>
  </div>

  <div data-loader style="position:fixed;inset:0;z-index:200;background:#F1EEE8;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;animation:omLoaderOut .8s cubic-bezier(.16,1,.3,1) 1.35s forwards;">
    <div style="display:flex;align-items:center;gap:11px;">
      <svg width="27" height="18" viewBox="0 0 343 229" style="display:block;flex:none;"><g fill="#E4622F"><circle cx="75.5" cy="27.5" r="27.5"></circle><circle cx="267.5" cy="27.5" r="27.5"></circle><circle cx="27.5" cy="114.5" r="27.5"></circle><circle cx="123.5" cy="114.5" r="27.5"></circle><circle cx="219.5" cy="114.5" r="27.5"></circle><circle cx="315.5" cy="114.5" r="27.5"></circle><circle cx="75.5" cy="201.5" r="27.5"></circle><circle cx="267.5" cy="201.5" r="27.5"></circle></g></svg>
      <span style="font-size:17px;font-weight:600;letter-spacing:-.035em;color:#15140F;">RaceOS</span>
    </div>
    <svg width="164" height="285" viewBox="40 48 122 212" style="display:block;">
      <line x1="48" y1="245" x2="48" y2="252" stroke="#15140F" stroke-opacity=".12" stroke-width="1"></line><line x1="65" y1="245" x2="65" y2="252" stroke="#15140F" stroke-opacity=".12" stroke-width="1"></line><line x1="82" y1="245" x2="82" y2="252" stroke="#15140F" stroke-opacity=".12" stroke-width="1"></line><line x1="99" y1="245" x2="99" y2="252" stroke="#15140F" stroke-opacity=".12" stroke-width="1"></line><line x1="116" y1="245" x2="116" y2="252" stroke="#15140F" stroke-opacity=".12" stroke-width="1"></line><line x1="133" y1="245" x2="133" y2="252" stroke="#15140F" stroke-opacity=".12" stroke-width="1"></line><line x1="150" y1="245" x2="150" y2="252" stroke="#15140F" stroke-opacity=".12" stroke-width="1"></line>
      <line x1="44" y1="245" x2="158" y2="245" stroke="#15140F" stroke-opacity=".2" stroke-width="1.2"></line>
        <g opacity="0" style="animation:omRunFrame 0.8s steps(1,end) infinite;animation-delay:-0.000s;">
          <g stroke="#15140F" stroke-opacity=".22" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="100.0,152.0 123.5,192.7 90.1,222.8 104.0,228.2"></polyline>
            <polyline points="112.1,95.3 95.6,121.6 116.5,141.7"></polyline>
          </g>
          <g stroke="#15140F" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="100.0" y1="152.0" x2="112.1" y2="95.3"></line>
            <line x1="112.1" y1="95.3" x2="116.4" y2="74.7"></line>
            <circle cx="116.4" cy="74.7" r="11.5" fill="#F1EEE8"></circle>
            <polyline points="100.0,152.0 117.6,195.6 119.2,240.6 134.2,240.9"></polyline>
            <polyline points="112.1,95.3 126.6,122.6 153.5,111.8"></polyline>
          </g>
        </g>
        <g opacity="0" style="animation:omRunFrame 0.8s steps(1,end) infinite;animation-delay:-0.700s;">
          <g stroke="#15140F" stroke-opacity=".22" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="100.0,155.0 128.9,192.0 107.8,231.8 122.4,235.2"></polyline>
            <polyline points="112.1,98.3 101.5,127.4 124.3,145.3"></polyline>
          </g>
          <g stroke="#15140F" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="100.0" y1="155.0" x2="112.1" y2="98.3"></line>
            <line x1="112.1" y1="98.3" x2="116.4" y2="77.7"></line>
            <circle cx="116.4" cy="77.7" r="11.5" fill="#F1EEE8"></circle>
            <polyline points="100.0,155.0 101.6,202.0 75.2,238.4 89.6,242.6"></polyline>
            <polyline points="112.1,98.3 123.7,127.0 150.2,115.2"></polyline>
          </g>
        </g>
        <g opacity="0" style="animation:omRunFrame 0.8s steps(1,end) infinite;animation-delay:-0.600s;">
          <g stroke="#15140F" stroke-opacity=".22" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="100.0,152.0 131.4,186.9 134.6,231.8 149.6,231.9"></polyline>
            <polyline points="112.1,95.3 109.9,126.2 136.0,138.9"></polyline>
          </g>
          <g stroke="#15140F" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="100.0" y1="152.0" x2="112.1" y2="95.3"></line>
            <line x1="112.1" y1="95.3" x2="116.4" y2="74.7"></line>
            <circle cx="116.4" cy="74.7" r="11.5" fill="#F1EEE8"></circle>
            <polyline points="100.0,152.0 82.4,195.6 51.1,227.9 65.3,233.0"></polyline>
            <polyline points="112.1,95.3 115.3,126.1 144.1,123.1"></polyline>
          </g>
        </g>
        <g opacity="0" style="animation:omRunFrame 0.8s steps(1,end) infinite;animation-delay:-0.500s;">
          <g stroke="#15140F" stroke-opacity=".22" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="100.0,147.0 124.9,186.9 131.2,231.4 146.2,231.1"></polyline>
            <polyline points="112.1,90.3 119.6,120.3 148.5,121.4"></polyline>
          </g>
          <g stroke="#15140F" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="100.0" y1="147.0" x2="112.1" y2="90.3"></line>
            <line x1="112.1" y1="90.3" x2="116.4" y2="69.7"></line>
            <circle cx="116.4" cy="69.7" r="11.5" fill="#F1EEE8"></circle>
            <polyline points="100.0,147.0 103.3,193.9 63.5,215.0 76.9,221.8"></polyline>
            <polyline points="112.1,90.3 102.5,119.8 129.0,131.5"></polyline>
          </g>
        </g>
        <g opacity="0" style="animation:omRunFrame 0.8s steps(1,end) infinite;animation-delay:-0.400s;">
          <g stroke="#15140F" stroke-opacity=".22" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="100.0,144.0 117.6,187.6 119.2,232.6 134.2,232.9"></polyline>
            <polyline points="112.1,87.3 126.6,114.6 153.5,103.8"></polyline>
          </g>
          <g stroke="#15140F" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="100.0" y1="144.0" x2="112.1" y2="87.3"></line>
            <line x1="112.1" y1="87.3" x2="116.4" y2="66.7"></line>
            <circle cx="116.4" cy="66.7" r="11.5" fill="#F1EEE8"></circle>
            <polyline points="100.0,144.0 123.5,184.7 90.1,214.8 104.0,220.2"></polyline>
            <polyline points="112.1,87.3 95.6,113.6 116.5,133.7"></polyline>
          </g>
        </g>
        <g opacity="0" style="animation:omRunFrame 0.8s steps(1,end) infinite;animation-delay:-0.300s;">
          <g stroke="#15140F" stroke-opacity=".22" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="100.0,146.0 101.6,193.0 75.2,229.4 89.6,233.6"></polyline>
            <polyline points="112.1,89.3 123.7,118.0 150.2,106.2"></polyline>
          </g>
          <g stroke="#15140F" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="100.0" y1="146.0" x2="112.1" y2="89.3"></line>
            <line x1="112.1" y1="89.3" x2="116.4" y2="68.7"></line>
            <circle cx="116.4" cy="68.7" r="11.5" fill="#F1EEE8"></circle>
            <polyline points="100.0,146.0 128.9,183.0 107.8,222.8 122.4,226.2"></polyline>
            <polyline points="112.1,89.3 101.5,118.4 124.3,136.3"></polyline>
          </g>
        </g>
        <g opacity="0" style="animation:omRunFrame 0.8s steps(1,end) infinite;animation-delay:-0.200s;">
          <g stroke="#15140F" stroke-opacity=".22" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="100.0,150.0 82.4,193.6 51.1,225.9 65.3,231.0"></polyline>
            <polyline points="112.1,93.3 115.3,124.1 144.1,121.1"></polyline>
          </g>
          <g stroke="#15140F" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="100.0" y1="150.0" x2="112.1" y2="93.3"></line>
            <line x1="112.1" y1="93.3" x2="116.4" y2="72.7"></line>
            <circle cx="116.4" cy="72.7" r="11.5" fill="#F1EEE8"></circle>
            <polyline points="100.0,150.0 131.4,184.9 134.6,229.8 149.6,229.9"></polyline>
            <polyline points="112.1,93.3 109.9,124.2 136.0,136.9"></polyline>
          </g>
        </g>
        <g opacity="0" style="animation:omRunFrame 0.8s steps(1,end) infinite;animation-delay:-0.100s;">
          <g stroke="#15140F" stroke-opacity=".22" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="100.0,151.0 103.3,197.9 63.5,219.0 76.9,225.8"></polyline>
            <polyline points="112.1,94.3 102.5,123.8 129.0,135.5"></polyline>
          </g>
          <g stroke="#15140F" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="100.0" y1="151.0" x2="112.1" y2="94.3"></line>
            <line x1="112.1" y1="94.3" x2="116.4" y2="73.7"></line>
            <circle cx="116.4" cy="73.7" r="11.5" fill="#F1EEE8"></circle>
            <polyline points="100.0,151.0 124.9,190.9 131.2,235.4 146.2,235.1"></polyline>
            <polyline points="112.1,94.3 119.6,124.3 148.5,125.4"></polyline>
          </g>
        </g>
    </svg>
    <div style="display:flex;flex-direction:column;align-items:center;gap:14px;">
      <div style="width:132px;height:2px;background:rgba(21,20,15,.12);overflow:hidden;">
        <div style="width:100%;height:100%;background:#E4622F;transform-origin:left center;animation:omLoaderBar 1.5s cubic-bezier(.35,.9,.25,1) forwards;"></div>
      </div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:9.5px;letter-spacing:.2em;color:#8C8578;white-space:nowrap;">MOTION STUDY No. 4 · RUN</div>
    </div>
  </div>
`;

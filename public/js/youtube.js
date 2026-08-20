// 유튜브 직캠 & 자체 콘텐츠 딥링크 생성기
const YouTubeManager = {
    parseKeywords(aiResponseText) {
      const regex = /\[YOUTUBE:\s*(.+?)\]/;
      const match = aiResponseText.match(regex);
      if (!match) return [];
      
      return match[1].split(',').map(kw => kw.trim()).filter(Boolean);
    },
  
    renderLinks(containerId, biasName, keywords) {
      const container = document.getElementById(containerId);
      if (!container) return;
  
      if (!keywords || keywords.length === 0) {
        keywords = [`${biasName} 레전드 직캠`, `${biasName} 자체콘텐츠 명작`, `${biasName} 입덕영상`];
      }
  
      container.innerHTML = `
        <h3 style="font-size:1.1rem; margin-bottom:12px; font-weight:800;">📺 [${biasName}] 추천 시청 큐레이션</h3>
        <div class="youtube-list">
          ${keywords.map(kw => {
            const encoded = encodeURIComponent(kw);
            const ytUrl = `https://www.youtube.com/results?search_query=${encoded}`;
            return `
              <a href="${ytUrl}" target="_blank" rel="noopener noreferrer" class="yt-link-card">
                <span>📼 ${kw}</span>
                <span style="font-size:0.85rem; color:var(--primary);">보러가기 ↗</span>
              </a>
            `;
          }).join('')}
        </div>
      `;
    }
  };
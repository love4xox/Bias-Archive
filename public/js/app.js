document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const biasForm = document.getElementById('biasForm');
  const biasNameInput = document.getElementById('biasName');
  const friendTasteInput = document.getElementById('friendTaste');
  const submitBtn = document.getElementById('submitBtn');
  const loadingBox = document.getElementById('loadingBox');
  const resultBox = document.getElementById('resultBox');
  const resultContent = document.getElementById('resultContent');
  const resultBiasTitle = document.getElementById('resultBiasTitle');
  const saveBtn = document.getElementById('saveBtn');
  const shareLinkBtn = document.getElementById('shareLinkBtn');
  const chipButtons = document.querySelectorAll('.chip');

  let currentGuide = null;

  // 마크다운 완벽 제거 및 HTML 변환기
  function formatGuideText(text) {
      if (!text) return '';

      // 유튜브 검색 태그 분리
      let cleanText = text.split('[YOUTUBE:')[0].trim();

      return cleanText
          // 1. 구분선 치환
          .replace(/^---$/gm, '<hr>')
          // 2. 제목 (###, ####) 치환
          .replace(/^#{1,6}\s*(.*$)/gim, '<h3 style="color:#ff4d8d; margin-top:16px; margin-bottom:8px; font-weight:800;">$1</h3>')
          // 3. 굵은 글씨 (**텍스트**) 치환
          .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#8b5cf6; font-weight:800;">$1</strong>')
          // 4. 불릿 포인트 (* 항목) 치환
          .replace(/^\s*\*\s*(.*$)/gim, '<div style="margin-left:8px; margin-bottom:4px;">• $1</div>')
          // 5. 줄바꿈 처리
          .replace(/\n/g, '<br>');
  }

  tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
          const targetTab = btn.dataset.tab;
          tabButtons.forEach(b => b.classList.remove('active'));
          tabContents.forEach(c => c.classList.remove('active'));
          btn.classList.add('active');
          const targetContent = document.getElementById(`tab-${targetTab}`);
          if (targetContent) targetContent.classList.add('active');

          if (targetTab === 'storage' && window.loadStorageItems) {
              window.loadStorageItems();
          }
          if (targetTab === 'youtube' && window.renderYoutubeLinks) {
              window.renderYoutubeLinks(currentGuide ? currentGuide.biasName : '');
          }
      });
  });

  chipButtons.forEach(chip => {
      chip.addEventListener('click', () => {
          chip.classList.toggle('active');
      });
  });

  biasForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const biasName = biasNameInput.value.trim();
      const friendTaste = friendTasteInput.value.trim();
      const selectedChips = Array.from(document.querySelectorAll('.chip.active')).map(c => c.dataset.val);

      if (!biasName || !friendTaste) return;

      submitBtn.disabled = true;
      loadingBox.style.display = 'block';
      resultBox.style.display = 'none';

      try {
          const response = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  biasName: biasName,
                  friendTaste: friendTaste,
                  focusPoints: selectedChips
              })
          });

          const data = await response.json();

          if (!response.ok) {
              throw new Error(data.error || '생성에 실패했습니다.');
          }

          // 서버 응답 키인 data.reply를 정확히 매핑
          const rawText = data.reply || data.guide || data.result || data.message || '';
          resultBiasTitle.innerText = `${biasName} 입덕 가이드`;

          // HTML 변환 함수 적용
          resultContent.innerHTML = formatGuideText(rawText);

          currentGuide = {
              id: Date.now().toString(),
              biasName: biasName,
              friendTaste: friendTaste,
              focusPoints: selectedChips,
              content: rawText,
              createdAt: new Date().toISOString()
          };

          resultBox.style.display = 'block';

          if (window.renderYoutubeLinks) {
              window.renderYoutubeLinks(biasName);
          }
      } catch (err) {
          alert(`오류: ${err.message}`);
      } finally {
          loadingBox.style.display = 'none';
          submitBtn.disabled = false;
      }
  });

  if (saveBtn) {
      saveBtn.addEventListener('click', () => {
          if (!currentGuide) return;
          if (window.saveToStorage) {
              window.saveToStorage(currentGuide);
              alert('영업 백서 보관함에 저장되었습니다!');
          }
      });
  }

  if (shareLinkBtn) {
      shareLinkBtn.addEventListener('click', async () => {
          if (!currentGuide || !currentGuide.content) return;
          try {
              await navigator.clipboard.writeText(currentGuide.content);
              alert('입덕 백서 내용이 클립보드에 복사되었습니다!');
          } catch (err) {
              alert('복사에 실패했습니다.');
          }
      });
  }
});
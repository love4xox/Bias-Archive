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

  // 마크다운 문법을 HTML로 직접 변환하는 내장 파서 함수
  function parseMarkdownToHTML(text) {
      if (!text) return '';
      
      let html = text
          // 1. 구분선 치환 (---)
          .replace(/^---$/gm, '<hr>')
          // 2. 제목 치환 (###, ##, #)
          .replace(/^### (.*$)/gim, '<h3>$1</h3>')
          .replace(/^## (.*$)/gim, '<h2>$1</h2>')
          .replace(/^# (.*$)/gim, '<h1>$1</h1>')
          // 3. 볼드체 치환 (**내용**)
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          // 4. 리스트 항목 치환 (* 항목)
          .replace(/^\* (.*$)/gim, '<div class="list-item">• $1</div>')
          // 5. 줄바꿈 처리
          .replace(/\n/g, '<br>');

      return html;
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
                  bias_name: biasName,
                  friend_taste: friendTaste,
                  focus_points: selectedChips
              })
          });

          const data = await response.json();

          if (!response.ok) {
              throw new Error(data.error || '생성에 실패했습니다.');
          }

          const guideText = data.guide || data.result || data.message || '';
          resultBiasTitle.innerText = `${biasName} 입덕 가이드`;

          // 자체 내장 파서로 마크다운 기호 완전히 제거 및 서식 변환
          resultContent.innerHTML = parseMarkdownToHTML(guideText);

          currentGuide = {
              id: Date.now().toString(),
              biasName: biasName,
              friendTaste: friendTaste,
              focusPoints: selectedChips,
              content: guideText,
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
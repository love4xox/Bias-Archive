document.addEventListener('DOMContentLoaded', () => {
    // 1. 탭 네비게이션
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
  
    function switchTab(tabName) {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
  
      const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
      const activeContent = document.getElementById(`tab-${tabName}`);
  
      if (activeBtn && activeContent) {
        activeBtn.classList.add('active');
        activeContent.classList.add('active');
      }
  
      if (tabName === 'storage') {
        StorageManager.renderStorageList('storageList');
      }
    }
  
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
  
    // 2. 영업 포인트 칩 토글
    const chips = document.querySelectorAll('.chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chip.classList.toggle('active');
      });
    });
  
    // 3. 입덕 가이드 생성 폼 제출
    const form = document.getElementById('biasForm');
    const submitBtn = document.getElementById('submitBtn');
    const loadingBox = document.getElementById('loadingBox');
    const resultBox = document.getElementById('resultBox');
    const resultContent = document.getElementById('resultContent');
    const resultBiasTitle = document.getElementById('resultBiasTitle');
    const saveBtn = document.getElementById('saveBtn');
    const shareLinkBtn = document.getElementById('shareLinkBtn');
  
    let currentResult = null;
  
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      const biasName = document.getElementById('biasName').value.trim();
      const friendTaste = document.getElementById('friendTaste').value.trim();
      
      // 선택된 칩 모으기
      const selectedChips = Array.from(document.querySelectorAll('.chip.active'))
        .map(c => c.dataset.val);
  
      if (!biasName || !friendTaste) return;
  
      // UI 로딩 처리
      submitBtn.disabled = true;
      loadingBox.style.display = 'flex';
      resultBox.style.display = 'none';
  
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            biasName,
            friendTaste,
            focusPoints: selectedChips.join(', ')
          })
        });
  
        const data = await response.json();
  
        if (!response.ok) {
          throw new Error(data.error || '생성에 실패했습니다.');
        }
  
        // 키워드 파싱 및 텍스트 정리
        const keywords = YouTubeManager.parseKeywords(data.reply);
        const cleanReply = data.reply.split('[YOUTUBE:')[0].trim();
  
        currentResult = {
          biasName,
          content: cleanReply,
          keywords
        };
  
        resultBiasTitle.textContent = biasName;
        resultContent.textContent = cleanReply;
        resultBox.style.display = 'block';
  
        // 추천 영상 탭에도 바로 세팅
        YouTubeManager.renderLinks('youtubeVault', biasName, keywords);
  
      } catch (err) {
        alert('오류가 발생했습니다: ' + err.message);
      } finally {
        loadingBox.style.display = 'none';
        submitBtn.disabled = false;
      }
    });
  
    // 4. 보관함 저장 버튼
    saveBtn.addEventListener('click', () => {
      if (!currentResult) return;
      StorageManager.saveItem(currentResult);
      alert('📂 입덕 백서가 보관함에 저장되었습니다!');
    });
  
    // 5. 텍스트 복사 버튼
    shareLinkBtn.addEventListener('click', () => {
      if (!currentResult) return;
      const shareText = `💖 [최애 아카이브] ${currentResult.biasName} 입덕 영업 백서\n\n${currentResult.content}`;
      navigator.clipboard.writeText(shareText).then(() => {
        alert('✨ 클립보드에 영업 백서가 복사되었습니다!');
      });
    });
  
    // 6. 보관함 삭제 / 전체 삭제 / 상세 보기 이벤트 위임
    const storageList = document.getElementById('storageList');
    storageList.addEventListener('click', (e) => {
      const delBtn = e.target.closest('.del-btn');
      const viewBtn = e.target.closest('.view-btn');
  
      if (delBtn) {
        const id = delBtn.dataset.id;
        if (confirm('이 백서를 삭제할까요?')) {
          StorageManager.deleteItem(id);
          StorageManager.renderStorageList('storageList');
        }
      }
  
      if (viewBtn) {
        const id = viewBtn.dataset.id;
        const items = StorageManager.getItems();
        const item = items.find(i => i.id === Number(id));
        if (item) {
          currentResult = item;
          resultBiasTitle.textContent = item.biasName;
          resultContent.textContent = item.content;
          resultBox.style.display = 'block';
          switchTab('generator');
          resultBox.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  
    document.getElementById('clearAllBtn').addEventListener('click', () => {
      if (confirm('보관함의 모든 영업 백서를 삭제하시겠습니까?')) {
        StorageManager.clearAll();
        StorageManager.renderStorageList('storageList');
      }
    });
  });
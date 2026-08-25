// 장데이터 JSON 백업 데이터 (file:// CORS 로컬 직접 실행 시 fallback용)
const FALLBACK_CHAPTERS = [
  {
    "장": "1",
    "제목": "개요",
    "본문": "본 보고서는 행정안전부 안전정책총괄과가 2026년 상반기 실시한 종합 안전점검 결과를 정리한 자료다.\n\n총 점검 건수는 **450건**이며, 지적사항 **120건** 중 시정 완료율은 **85%**이다. 예산 집행률은 **92%**, 총괄책임자는 **권혁수** 안전정책총괄과장이다."
  },
  {
    "장": "2",
    "제목": "분야별 결과",
    "본문": "분야별 점검은 시설안전·교통안전·재난안전·산업안전 4개 분야로 진행됐다. 분야별 총합은 **450건**과 일치한다.\n\n지적사항 **115건** 중 80% 이상이 1분기 내 시정되었으며, 누적 시정 완료율은 **85%**으로 집계됐다. "
  },
  {
    "장": "3",
    "제목": "예산 운용",
    "본문": "상반기 예산 집행률 **90%**은 전년 동기 대비 5%p 상승한 수치다. \n\n총괄 운영은 **권혁수** 과장이 직접 주재했고, 분기별 점검회의 5회를 개최했다."
  },
  {
    "장": "4",
    "제목": "향후 계획",
    "본문": "하반기에는 추가 점검 **440건**을 목표로 추진한다. \n\n상반기 시정 완료율 **82%** 수준에 머문 일부 지자체는 추가 컨설팅 대상으로 지정한다. "
  },
  {
    "장": "5",
    "제목": "결론",
    "본문": "행정안전부 안전정책총괄과는 2026년 상반기 동안 **450건**의 안전점검을 차질 없이 완료했다. 총괄 책임은 **권혁주** 과장이 맡았으며, 향후에도 분기별 점검 체계를 강화한다. "
  }
];

let chapterData = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadChapterData();
  setupSearch();
  renderCards(chapterData, '');
});

async function loadChapterData() {
  try {
    const response = await fetch('./장데이터.json');
    if (!response.ok) throw new Error('Network response was not ok');
    chapterData = await response.json();
  } catch (err) {
    console.warn('fetch 실패, fallback 데이터 사용:', err);
    chapterData = FALLBACK_CHAPTERS;
  }
}

function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearBtn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const keyword = e.target.value.trim();
      if (clearBtn) {
        clearBtn.style.display = keyword.length > 0 ? 'block' : 'none';
      }
      filterAndRender(keyword);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        searchInput.focus();
        filterAndRender('');
      }
    });
  }
}

function filterAndRender(keyword) {
  let filtered = chapterData;
  if (keyword) {
    const lower = keyword.toLowerCase();
    filtered = chapterData.filter(item => {
      const titleMatch = item.제목 && item.제목.toLowerCase().includes(lower);
      const bodyMatch = item.본문 && item.본문.toLowerCase().includes(lower);
      return titleMatch || bodyMatch;
    });
  }

  // 요구사항 2: 키워드 검색은 제목 또는 본문으로 필터링하고 "결과 N건"으로 표시
  const resultCountEl = document.getElementById('resultCount');
  if (resultCountEl) {
    resultCountEl.textContent = `결과 ${filtered.length}건`;
  }

  renderCards(filtered, keyword);
}

function renderCards(data, keyword) {
  const container = document.getElementById('cardsContainer');
  if (!container) return;

  if (data.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>검색 결과가 없습니다</h3>
        <p>"${escapeHtml(keyword)}" 키워드와 일치하는 장이 존재하지 않습니다.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = data.map(item => {
    const chapterNum = item.장;
    const title = item.제목;
    const body = item.본문;

    const highlightedTitle = highlightKeyword(title, keyword);
    const formattedBody = formatMarkdownAndHighlight(body, keyword);

    return `
      <div class="card">
        <div class="card-header">
          <span class="chapter-badge">제 ${chapterNum} 장</span>
          <h2 class="card-title">${highlightedTitle}</h2>
        </div>
        <div class="card-body">
          <p class="summary-text">${formattedBody}</p>
        </div>
      </div>
    `;
  }).join('');
}

function formatMarkdownAndHighlight(text, keyword) {
  if (!text) return '';
  
  // Markdown **bold** conversion
  let html = text.replace(/\*\*(.*?)\*\*/g, '<strong class="highlight-bold">$1</strong>');
  
  // Newline to paragraph breaks
  html = html.split('\n\n').map(p => p.replace(/\n/g, '<br>')).join('</p><p>');
  html = `<p>${html}</p>`;

  if (keyword) {
    const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi');
    // Highlight inside text without breaking HTML tags
    html = highlightTextNodes(html, regex);
  }

  return html;
}

function highlightKeyword(text, keyword) {
  if (!text) return '';
  const escapedText = escapeHtml(text);
  if (!keyword) return escapedText;
  const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi');
  return escapedText.replace(regex, '<mark class="keyword-mark">$1</mark>');
}

function highlightTextNodes(htmlString, regex) {
  const div = document.createElement('div');
  div.innerHTML = htmlString;

  function walk(node) {
    if (node.nodeType === 3) { // Text node
      if (regex.test(node.nodeValue)) {
        const span = document.createElement('span');
        span.innerHTML = node.nodeValue.replace(regex, '<mark class="keyword-mark">$1</mark>');
        node.parentNode.replaceChild(span, node);
      }
    } else if (node.nodeType === 1 && node.nodeName !== 'MARK') {
      Array.from(node.childNodes).forEach(walk);
    }
  }

  Array.from(div.childNodes).forEach(walk);
  return div.innerHTML;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, match => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return map[match];
  });
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

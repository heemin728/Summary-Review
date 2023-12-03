const searchInput = document.getElementById('searchInput');
const resultDiv = document.getElementById('list-group');
const apiKey = 'bc4b457fb0e80dfecd077dfd9dc885d2'; // 카카오 API 키
let restaurantData = [];
let currentId;

document.addEventListener('DOMContentLoaded', function () {
    checkIfKeywordExists(); // 검색할 키워드가 주소에 있는지 확인 
});

function checkIfKeywordExists() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('query');

    if (!query) {
        return;
    }
    document.getElementById('searchInput').value = query;
    searchPlaces(); // 키워드로 카카오 API 받아오기
}

// 입력한 검색어로 카카오에서 음식점 리스트 받아오는 함수
function searchPlaces() {
    const query = searchInput.value;

    if (!query) {
        alert('검색어를 입력하세요.');
        return;
    }

    const apiUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${query}&category_group_code=FD6&radius=20000`;

    fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Authorization': `KakaoAK ${apiKey}`
        },
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            storeRestaurantResults(data); // 식당 정보 저장
            displayResults(query, data); // 리스트 표시
            moveScroll(); // 스크롤 아래로 쭉
        })
        .catch(error => {
            console.error('에러:', error);
            alert('검색 중 오류가 발생했습니다.');
        });
}

// 선택한 음식점 정보 저장
function storeRestaurantResults(data) {
    if (data.documents.length > 0) {
        restaurantData = data.documents.map(place => ({
            name: place.place_name,
            address: place.address_name,
            id: place.id
        }));
    } else {
        restaurantData = [];
        console.warn('검색 결과가 없습니다.');
    }
}

// id를 통해 음식점 정보 검색
function getRestaurantResultsById(id) {
    const restaurant = restaurantData.find(place => place.id === id);

    if (restaurant) {
        console.log(restaurant.name);
        return {
            name: restaurant.name,
            address: restaurant.address,
            id: restaurant.id
        };
    } else {
        console.error(`ID ${id}에 해당하는 음식점을 찾을 수 없습니다.`);
        return {};
    }
}

// 음식점 결과로 스크롤
function moveScroll() {
    const target = document.getElementById('resultArea').offsetTop;
    window.scrollTo({ left: 0, top: target - 150 });
}


// 카카오 API에서 가져온 리스트 보여주기
function displayResults(query, data) {

    const noticeArea = document.getElementById("notice");
    noticeArea.innerHTML = `'${query}'의 검색 결과입니다. `

    resultDiv.innerHTML = '';

    if (data.documents.length === 0) {
        resultDiv.innerHTML = '<p>검색 결과가 없습니다.</p>';
        return;
    }

    data.documents.forEach(place => {
        const name = place.place_name;
        const address = place.address_name;
        const id = place.id;

        const className = "list-group-item";
        resultDiv.innerHTML +=
            `<li class="${className}" style="display: flex; align-items: center;">
                <div style="flex: 1;">
                    <p> <h2 class="my-font"><strong>${name}</strong></h2>${address}</p>
                </div>
                <button id="${id}" class="btn btn-primary btn-lg"  onClick="movePage(this.id)" style="margin-left: 30px;">확인하기</button>
            </li>`;
    });
}

function movePage(id) {
    window.location.href = `/resultPage?name=${getRestaurantResultsById(id).address} ${getRestaurantResultsById(id).name}`;
}
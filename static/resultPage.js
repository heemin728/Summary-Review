let id = "none";
let resName = "none";

document.addEventListener('DOMContentLoaded', function () {
    getURL(); // URL 파라미터
});

// 파라미터 가져옴
function getURL() {
    const urlParams = new URLSearchParams(window.location.search);
    resName = urlParams.get('name');
    searchPlaces(resName);
}

// 입력한 검색어로 카카오에서 음식점 리스트 받아옴..
function searchPlaces(query) {
    console.log('search');

    const apiKey = 'bc4b457fb0e80dfecd077dfd9dc885d2'; // 카카오 API 키
    const apiUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${query}&category_group_code=FD6&radius=20000`;

    fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Authorization': `KakaoAK ${apiKey}`
        },
        })
        .then(response => response.json())
        .then(data => {
            
            if(data.documents.length==0){
                handleNoRes();
                return;
            }
            if (data.documents.length >= 2) {
                moveToMainPage(query);
                return;
            }

            let restaurantData = data.documents.map(place => ({ // 식당
                name: place.place_name,
                address: place.address_name,
                id: place.id
            }));
            startFetching(restaurantData[0]);
        })
        .catch(error => {
            console.error('에러:', error);
            alert('검색 중 오류가 발생했습니다.');
        });
}


// '확인하기' 버튼을 눌렀을 때 - 크롤링 시작
function startFetching(data) {

    const server_url = "http://127.0.0.1:8001/result"
    currentId = data.id;
    const url = "http://place.map.kakao.com/" + data.id;
    const headerResultContainer = document.getElementById("headResult");
    const averageResultContainer = document.getElementById("average-rating");
    const posSumContainer = document.getElementById("pos-sum");
    const negSumContainer = document.getElementById("neg-sum");

    headerResultContainer.innerHTML = `<h2><strong>${data.name}<strong> 의 검색 결과</h2>`
    averageResultContainer.innerHTML = ``;
    posSumContainer.innerHTML = ``;
    negSumContainer.innerHTML = ``;

    createLoadingBar();

    console.log('start fetching');
    fetch(server_url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
    })
        .then((response) => {
            console.log(response);
            if (response.ok) {
                console.log("response ok");
                return response.json();
            } else {
                console.log("response not ok");
                throw new Error("서버 오류");
            }
        })
        .then(data => {
            const reviews = data[0];
            const averageStar = data[1];
            const pos_num = data[2];
            const neg_num = data[3];

            averageResultContainer.innerHTML = `
                <h3 class="my-font" >${averageStar}</h3>
            `;

            posSumContainer.textContent = reviews[0][0].summary_text;
            negSumContainer.textContent = reviews[1][0].summary_text;

            appendChart1(averageStar);
            appendChart2(pos_num, neg_num);

            destroyLoadingBar();
            if (averageStar == -10) { // 리뷰가 없는 경우
                handleNoReviewCase();
                return;
            }
        })
        .catch(error => {
            console.error("Error:", error);
        });
}

//  클릭하면 해당 주소로 이동하는 함수
function moveToKakaoMap() {
    window.open("http://place.map.kakao.com/" + currentId, "_blank");
}

function moveToMainPage(query) {
    if (query == undefined) {
        window.location.href='/';
        return;
    }
    const newPageURL = '/?query=' + query;
    window.location.href = newPageURL;
}

function handleNoReviewCase() {
    alert('등록된 후기가 없습니다.');
    moveToMainPage();
}

function handleNoRes(){
    alert('해당하는 음식점이 없습니다.');
    moveToMainPage();
}

function createLoadingBar() {
    const body = document.getElementById('page-top');
    body.style.opacity = 0.3;

    const spinner = document.getElementById('spinner1');
    spinner.style.display = 'flex';
}

function destroyLoadingBar() {
    const body = document.getElementById('page-top');
    body.style.opacity = 1;

    const spinner = document.getElementById('spinner1');
    spinner.style.display = 'none';
}

function appendChart1(averageStar) {

    const standardStar = 2.5;
    const canvas = document.getElementById("chart1");
    const ctx = canvas.getContext('2d');

    const data = {
        labels: ["해당 음식점", "숭실대 주변"],
        datasets: [{
            /* *********** */
            categoryPercentage: 0.5,
            barPercentage: 1,
            //barThickness:19, // 두께 : 이 옵션 실행시 barPercentage 와 categoryPercentage는 무시됨. 
            /* *********** */
            borderRadius: 100,
            fill: true,
            label: resName,
            backgroundColor: [
                'moccasin',
                'lightpink'],
            data: [averageStar, standardStar]
        }],
    };

    // Notice how nested the beginAtZero is
    const options = {
        title: {
            display: true,
            text: '리뷰 비교',
            position: 'bottom'
        },
        maintainAspectRatio: false
    };

    // Chart declaration:
    new Chart(ctx, {
        type: 'bar',
        data: data,
        options: options
    });

    const container = document.getElementById('compare-near');
    if (averageStar > standardStar) {
        container.innerHTML = `숭실대 주변보다 <strong>${(averageStar - standardStar).toFixed(1)}</strong>점 높아요.`;
    }
    else {
        container.innerHTML = `숭실대 주변보다 <strong>${(standardStar - averageStar).toFixed(1)}</strong>점 낮아요.`;
    }
}


function appendChart2(pos_num, neg_num) {

    const data = {
        labels: ['긍정 리뷰', '부정 리뷰'],
        datasets: [{
            data: [pos_num * 100 / (pos_num + neg_num), neg_num * 100 / (pos_num + neg_num)],
            backgroundColor: ['#ECC7B3', '#B8E3D8'],
            hoverBackgroundColor: ['#F9DEC2', '#CBE8EC']
        }]
    };

    const options = {
        cutoutPercentage: 50,
        responsive: true,
        maintainAspectRatio: false,
    };


    const ctx = document.getElementById('chart2').getContext('2d');
    const myChart = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: options
    }
    );

    const container = document.getElementById('sum-explain');
    container.innerHTML = `<strong>${(pos_num * 100 / (pos_num + neg_num)).toFixed(1)}</strong>%의 고객이 긍정적인 반응을 보였어요.`;
}

function destroyChart() {

    var chart1 = Chart.getChart("chart1");
    if (chart1) {
        chart1.destroy();
    }

    var chart2 = Chart.getChart("chart2");
    if (chart2) {
        chart2.destroy();
    }
}
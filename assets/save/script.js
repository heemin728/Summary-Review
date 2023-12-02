const searchInput = document.getElementById('searchInput');
const resultDiv = document.getElementById('list-group');
const apiKey = 'bc4b457fb0e80dfecd077dfd9dc885d2'; // īī�� API Ű
let restaurantData = [];
let currentId;

// �Է��� �˻���� īī������ ������ ����Ʈ �޾ƿ�
function searchPlaces() {
    const query = searchInput.value;

    if (!query) {
        alert('�˻�� �Է��ϼ���.');
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
            storeRestaurantResults(data);
            displayResults(data);
            noticeResults(query);
            moveScroll();
        })
        .catch(error => {
            console.error('����:', error);
            alert('�˻� �� ������ �߻��߽��ϴ�.');
        });
}

// ������ ������ ���� ����
function storeRestaurantResults(data) {
    if (data.documents.length > 0) {
        restaurantData = data.documents.map(place => ({
            name: place.place_name,
            address: place.address_name,
            id: place.id
        }));
    } else {
        restaurantData = [];
        console.warn('�˻� ����� �����ϴ�.');
    }
}

// id�� ���� ������ ���� �˻�
function getRestaurantResultsById(id) {
    const restaurant = restaurantData.find(place => place.id === id);

    if (restaurant) {
        return {
            name: restaurant.name,
            address: restaurant.address,
            id: restaurant.id
        };
    } else {
        console.error(`ID ${id}�� �ش��ϴ� �������� ã�� �� �����ϴ�.`);
        return {};
    }
}

// ������ ����� ��ũ��
function moveScroll() {
    const target = document.getElementById('resultArea').offsetTop;
    window.scrollTo({ left: 0, top: target - 150 });
}

function noticeResults(query) {
    const noticeArea = document.getElementById("notice");
    noticeArea.innerHTML = `'${query}'�� �˻� ����Դϴ�. `
}

// īī�� API���� ������ ����Ʈ �����ֱ�
function displayResults(data) {
    resultDiv.innerHTML = '';

    if (data.documents.length === 0) {
        resultDiv.innerHTML = '<p>�˻� ����� �����ϴ�.</p>';
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
        <button id="${id}" class="btn btn-primary btn-lg" data-bs-toggle="modal" data-bs-target="#portfolioModal1" onClick="handleSubmit(this.id)" style="margin-left: 30px;">Ȯ���ϱ�</button>
         </li>`;
    });
}

/*
�������� ���� �޾ƿ���
*/
const get_url = "http://127.0.0.1:8000/";

// 'Ȯ���ϱ�' ��ư�� ������ �� - ũ�Ѹ� ����
function handleSubmit(id) {
    currentId = id;
    const url = "http://place.map.kakao.com/" + id;

    const headerResultContainer = document.getElementById("headResult");
    const averageResultContainer = document.getElementById("average-rating");
    const posSumContainer = document.getElementById("pos-sum");
    const negSumContainer = document.getElementById("neg-sum");

    headerResultContainer.innerHTML = `<h2><strong>${getRestaurantResultsById(id).name}<strong> �� �˻� ���</h2>`
    averageResultContainer.innerHTML = ``;
    posSumContainer.innerHTML = ``;
    negSumContainer.innerHTML = ``;

    console.log('start fetching');
    fetch(get_url, {
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
                throw new Error("���� ����");
            }
        })
        .then(data => {
            const reviews = data[0]; // ���� ������
            const averageStar = data[1]; // ��� ����
            const pos_num=data[2];
            const neg_num=data[3];

            console.log("pos_num=", pos_num , ", neg_num=",neg_num);

            averageResultContainer.innerHTML = `
                <h3 class="my-font" >${averageStar}</h3>
            `;

            // ���� ����Ʈ ���� �� ǥ��
            let index = 0;
            for (const reviewGroup of reviews) {
                console.log(reviewGroup);
                for (const review of reviewGroup) {
                    const reviewText = review.summary_text;
                    if (index == 0) {
                        posSumContainer.textContent = reviewText;
                        index++;
                    }
                    else if (index == 1) {
                        negSumContainer.textContent = reviewText;
                    }
                }
                appendChart1();
                appendChart2(pos_num,neg_num);
            }
        })
        .catch(error => {
            console.error("Error:", error);
        });
}




function appendChart1(){
    const data = {
        labels: ['������', '����� ���', '��ü ���'],
        datasets: [{
            label: '������� ��',
            backgroundColor: ['#BCA79C', '#A7D8CE', '#DAA1D1'],
            borderColor: ['#BCA79C', '#A7D8CE', '#DAA1D1'],
            barPercentage: 1,
            barThickness: 50,
            data: [-1.3, 2.4, -5.3,]
        }]
    };

    var ctx = document.getElementById('barChart').getContext('2d');
    var chart = new Chart(ctx, {
        type: 'bar', // 
        data: data
    });
    // chart.destroy();

    // ������ ũ�Ⱑ ����� �� ��Ʈ�� ��ġ ������
    // window.addEventListener('resize', centerChart);
    centerChart('barChart');

}

// ���� ��� ��Ʈ 2
function appendChart2(pos_num, neg_num){
    // console.log('test');
    // console.log(pos_num/(pos_num+neg_num));
    // console.log(neg_num/(pos_num+neg_num));

    const data = {
        labels: ['���� ����', '���� ����'],
        datasets: [{
            data: [pos_num*100/(pos_num+neg_num),neg_num*100/(pos_num+neg_num)],
            backgroundColor: ['#ECC7B3', '#B8E3D8'],
            hoverBackgroundColor: ['#F9DEC2', '#CBE8EC']
        }]
    };

    const options = {
        cutoutPercentage: 50,
        responsive: true,
        maintainAspectRatio: false
    };

    // let existingChart = Chart.getChart("barChart");

    // if (existingChart) {
    //     existingChart.destroy
    // }

    const ctx = document.getElementById('donutChart').getContext('2d');
    const myChart = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: options
    }
    );

    // ������ ũ�Ⱑ ����� �� ��Ʈ�� ��ġ ������
    //   window.addEventListener('resize', centerChart);
    centerChart('donutChart');

}

// // ��뺰�� ��Ʈ 1
// document.addEventListener('DOMContentLoaded', function () {

//     const data = {
//         labels: ['������', '����� ���', '��ü ���'],
//         datasets: [{
//             label: '������� ��',
//             backgroundColor: ['#BCA79C', '#A7D8CE', '#DAA1D1'],
//             borderColor: ['#BCA79C', '#A7D8CE', '#DAA1D1'],
//             barPercentage: 1,
//             barThickness: 50,
//             data: [-1.3, 2.4, -5.3,]
//         }]
//     };

//     var ctx = document.getElementById('barChart').getContext('2d');
//     var chart = new Chart(ctx, {
//         type: 'bar', // 
//         data: data
//     });

//     // ������ ũ�Ⱑ ����� �� ��Ʈ�� ��ġ ������
//     // window.addEventListener('resize', centerChart);
//     centerChart('barChart');
// });


// document.addEventListener('DOMContentLoaded', function () {
//     console.log('test');
//     console.log(pos_num/(pos_num+neg_num));
//     console.log(neg_num/(pos_num+neg_num));
//     const data = {
//         labels: ['���� ����', '���� ����'],
//         datasets: [{
//             data: [30,70],
//             backgroundColor: ['#ECC7B3', '#B8E3D8'],
//             hoverBackgroundColor: ['#F9DEC2', '#CBE8EC']
//         }]
//     };

//     const options = {
//         cutoutPercentage: 50,
//         responsive: true,
//         maintainAspectRatio: false
//     };

//     const ctx = document.getElementById('donutChart').getContext('2d');
//     const myChart = new Chart(ctx, {
//         type: 'doughnut',
//         data: data,
//         options: options
//     });

//     // ������ ũ�Ⱑ ����� �� ��Ʈ�� ��ġ ������
//     //   window.addEventListener('resize', centerChart);
//     centerChart('donutChart');
// });


// ��Ʈ�� ����� ��ġ��Ű�� �Լ�
function centerChart(id) {
    const chartContainer = document.getElementById('myChartContainer');
    const chartCanvas = document.getElementById(id);

    const containerWidth = chartContainer.offsetWidth;
    const containerHeight = chartContainer.offsetHeight;

    const chartWidth = chartCanvas.width;
    const chartHeight = chartCanvas.height;

    const leftPosition = containerWidth / 2 - chartWidth / 2;
    const topPosition = containerHeight / 2 - chartHeight / 2;

    chartCanvas.style.left = `${leftPosition}px`;
    chartCanvas.style.top = `${topPosition}px`;
}

//  Ŭ���ϸ� �ش� �ּҷ� �̵��ϴ� �Լ�
function moveButtonClick() {
    window.open("http://place.map.kakao.com/" + currentId, "_blank");
}
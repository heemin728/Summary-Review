import json
import time
import re
from selenium import webdriver
from selenium.webdriver.common.by import By
from fastapi import FastAPI
from transformers import pipeline
from helium import *
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

print("Server loading...")
app = FastAPI()
# CORS ����
# CORS �̵���� ����
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # �� �κ��� �ʿ信 ���� �����ϼ���. "*"�� ��� origin�� ����մϴ�.
    allow_credentials=True,
    allow_methods=["*"],  # �ʿ��� HTTP �޼��带 �����ϼ���.
    allow_headers=["*"],  # �ʿ��� ����� �����ϼ���.
)
print("Server loaded")

# �� �ε�
print("model loading...")
sentiment_model = pipeline(model="WhitePeak/bert-base-cased-Korean-sentiment")
sum_model = pipeline("summarization", model="psyche/KoT5-summarization")
print("model loaded")

# �� ����̹� ����
print("web driver loading...")
options = webdriver.ChromeOptions()
options.page_load_strategy = "none"
prefs = {
    "profile.default_content_setting_values": {
        "cookies": 2,
        "images": 2,
        "plugins": 2,
        "popups": 2,
        "geolocation": 2,
        "notifications": 2,
        "auto_select_certificate": 2,
        "fullscreen": 2,
        "mouselock": 2,
        "mixed_script": 2,
        "media_stream": 2,
        "media_stream_mic": 2,
        "media_stream_camera": 2,
        "protocol_handlers": 2,
        "ppapi_broker": 2,
        "automatic_downloads": 2,
        "midi_sysex": 2,
        "push_messaging": 2,
        "ssl_cert_decisions": 2,
        "metro_switch_to_desktop": 2,
        "protected_media_identifier": 2,
        "app_banner": 2,
        "site_engagement": 2,
        "durable_storage": 2,
    }
}
options.add_experimental_option("prefs", prefs)
options.add_argument("start-maximized")
options.add_argument("disable-infobars")
options.add_argument("--disable-extensions")
options.add_argument("--headless")
driver = start_chrome(options=options)
print("web driver loaded")


def fetch_reviews(url):
    restaurant_data = {}
    driver.get(url)
    # ������ �ε� ���
    wait_until(Text("��ü").exists, timeout_secs=10)

    restaurant_name = ""
    least_review_number = 3
    ave_relative_score = 0
    total_review = 0

    restaurant_name = driver.find_elements(By.CSS_SELECTOR, ".tit_location")[1].text

    restaurant_data = {restaurant_name: []}
    print("���� ��ȸ ����")
    while True:
        if Text("�ı� ������").exists():
            click(Text("�ı� ������"))
            time.sleep(0.1)
        else:
            print("���̻� �ıⰡ �����ϴ�.")
            break

    review_list = driver.find_elements(By.CSS_SELECTOR, ".list_evaluation > li")

    for index in range(len(review_list)):
        (
            name,
            review_number,
            average_star,
            star,
            recommend_point_list,
            review_content,
        ) = process_review_data(
            driver, review_list[index], least_review_number, total_review
        )

        if review_number < least_review_number:
            continue

        save_review_to_json(
            restaurant_name,
            restaurant_data,
            total_review,
            name,
            review_number,
            average_star,
            star,
            recommend_point_list,
            review_content,
        )

        total_review += 1
        ave_relative_score += average_star - star

    average_relative_score=1
    if total_review==0:
        average_relative_score=0
    else:
        average_relative_score=round(ave_relative_score/total_review,2)

    with open("crawling_data.json", "w", encoding="utf-8") as f:
        json.dump(restaurant_data, f, indent=4, ensure_ascii=False)

    return {
        "restaurant_name": restaurant_name,
        "average_relative_score": average_relative_score,
        "review_data": restaurant_data,
    }


def process_review_data(driver, review, least_review_number, total_review):
    name = review.find_elements(By.CSS_SELECTOR, ".link_user")[0].text
    review_number_text = review.find_elements(By.CSS_SELECTOR, ".txt_desc")[0].text
    review_number = int(review_number_text.replace(",", ""))
    average_star = float(review.find_elements(By.CSS_SELECTOR, ".txt_desc")[1].text)

    star_element = driver.find_elements(By.CSS_SELECTOR, ".ico_star.inner_star")[
        total_review + 1
    ]
    style_attribute = star_element.get_attribute("style")
    width_value = None

    if style_attribute:
        width_match = re.search(r"width: (\d+)%;", style_attribute)
        if width_match:
            width_value = width_match.group(1)

    star = int(width_value) / 20

    recommend_point = review.find_elements(By.CSS_SELECTOR, ".chip_likepoint")
    recommend_point_list = [rp.text for rp in recommend_point]

    review_content = review.find_elements(By.CSS_SELECTOR, ".txt_comment > span")[
        0
    ].text

    return name, review_number, average_star, star, recommend_point_list, review_content


def save_review_to_json(
    restaurant_name,
    restaurant_data,
    total_review,
    name,
    review_number,
    average_star,
    star,
    recommend_point_list,
    review_content,
):
    review_dict = {
        "id": total_review,
        "name": name,
        "review_count": review_number,
        "average_rating": average_star,
        "rating": star,
        "relative_score": star - average_star,
        "recommend_point": recommend_point_list,
        "review_content": review_content,
    }

    restaurant_data[restaurant_name].append(review_dict)

class InputData(BaseModel):
    url: str

@app.post("/")
def scrape_and_get_reviews(data: InputData):
    url=data.url
    start_time = time.time()
    print("fetch_reviews start")
    data = fetch_reviews(url)
    print("fetch_reviews end")

    pos_con = []
    neg_con = []
    con = []
    res_name = data["restaurant_name"]

    pos_num=0;
    neg_num=0;

    # ������ ���� ����
    for review in data["review_data"][res_name]:
        if review["review_content"] != "":
            con.append(review["review_content"])

    # ���� ���� ���� �з�
    print("���� �з� ����")
    for review in con:
        # print(sentiment_model(review)[0]["label"])
        # print(review)
        if sentiment_model(review)[0]["label"] == "LABEL_1":  # ����
            pos_con.append(review)
            pos_num+=1
        elif sentiment_model(review)[0]["label"] == "LABEL_0":  # ����
            neg_num+=1
            neg_con.append(review)
    print("���� �з� �Ϸ�")

    positive_sum = ""
    for review in pos_con:
        positive_sum += review + "\n"
    negative_sum = ""
    for review in neg_con:
        negative_sum += review + "\n"

    sum_review = []
    print("���� ��� ����")
    sum_review.append(sum_model(positive_sum, max_length=100, min_length=5))
    sum_review.append(sum_model(negative_sum, max_length=100, min_length=5))
    sum_review.append(data["average_relative_score"])
    print("���� ��� �Ϸ�")
    end_time = time.time()
    print("�ҿ� �ð� : ", end_time - start_time)
    average_star=data["average_relative_score"]

    return sum_review, average_star, pos_num, neg_num


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
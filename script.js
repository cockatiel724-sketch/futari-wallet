const GAS_URL = "https://script.google.com/macros/s/AKfycbxhaRGwV4_Wpy5eI_cdQcKNYZqXn6eIcLWRQba8U-XmGRA-0Wa_v5bSxdCKJaeHFps/exec";


async function saveExpense(){
  
  
async function resizeImage(file) {

  return new Promise((resolve) => {

    const reader = new FileReader();

    reader.onload = (event) => {

      const img = new Image();

      img.onload = () => {

        const canvas =
          document.createElement("canvas");

        const ctx =
          canvas.getContext("2d");

        // 最大サイズ
        const maxWidth = 600;
        const maxHeight = 600;

        let width = img.width;
        let height = img.height;

        // 比率維持
        if (width > height) {

          if (width > maxWidth) {

            height *= maxWidth / width;
            width = maxWidth;
          }

        } else {

          if (height > maxHeight) {

            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(
          img,
          0,
          0,
          width,
          height
        );

        // JPEG圧縮
        const compressedBase64 =
          canvas.toDataURL(
            "image/jpeg",
            0.5
          );

        resolve(
          compressedBase64.split(",")[1]
        );
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
}
  
async function uploadImage(file) {

  try {

    const base64 = await resizeImage(file);

    const res = await fetch(GAS_URL, {
      method: "POST",
      body: JSON.stringify({
        type: "image",
        fileName: file.name,
        image: base64
      })
    });

    const text = await res.text();

    console.log("UPLOAD TEXT:", text);

    const json = JSON.parse(text);

    if(!json.success){
      throw new Error(json.error);
    }

    return json.url;

  } catch(err) {

    console.error("UPLOAD ERROR:", err);
    alert("画像アップ失敗");

    return "";

  }
}
  
  
  function toBase64(file) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = () => {
      resolve(reader.result.split(",")[1]);
    };

    reader.onerror = error => reject(error);

  });
}
  

  const saveButton =
    document.getElementById("saveButton");

  saveButton.innerText = "保存中...";
  saveButton.disabled = true;

  const amount =
    Number(document.getElementById("amount").value);

  const daikiShare =
    Number(document.getElementById("daiki_share").value);

  const kuriaShare =
    Number(document.getElementById("kuria_share").value);

  if(amount !== daikiShare + kuriaShare){

    alert("負担額の合計が一致していません");

    saveButton.innerText = "保存";
    saveButton.disabled = false;

    return;
  }

  // 画像取得（あれば）
  const file = document.getElementById("imageInput")?.files?.[0];
  let imageUrl = "";

  if(file){
    imageUrl = await uploadImage(file);
  }

  const data = {

    id: "exp_" + Date.now(),
    date: new Date().toISOString(),
    title: document.getElementById("title").value,
    amount: amount,
    payer: document.getElementById("payer").value,
    daiki_share: daikiShare,
    kuria_share: kuriaShare,
    memo: document.getElementById("memo").value,
    image: imageUrl,
    category: "food"
  };

  await fetch(GAS_URL, {
    method: "POST",
    
    body: JSON.stringify(data)
  });

  saveButton.innerText = "保存";
  saveButton.disabled = false;

  document.getElementById("title").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("memo").value = "";
  document.getElementById("daiki_share").value = "";
  document.getElementById("kuria_share").value = "";
  document.getElementById("imageInput").value = "";

  loadExpenses();
  showHome();
}






async function loadExpenses(){

  const response =
  await fetch(
    GAS_URL +
    "?type=getCurrentMonthExpenses"
  );

  const data = await response.json();

  data.reverse();


  let daikiBalance = 0;
  let kuriaBalance = 0;

  let daikiTotal = 0;
  let kuriaTotal = 0;

  let html = "";


  data.forEach(item => {

    const itemDate = new Date(item.date);

    const itemYear = itemDate.getFullYear();

    const itemMonth = itemDate.getMonth();

    const now = new Date();

    const currentYear = now.getFullYear();

    const currentMonth = now.getMonth();


    if(
      itemYear !== currentYear ||
      itemMonth !== currentMonth
    ){
      return;
    }


    const amount =
      isNaN(Number(item.amount))
        ? 0
        : Number(item.amount);

    const daikiShare =
      isNaN(Number(item.daiki_share))
        ? 0
        : Number(item.daiki_share);

    const kuriaShare =
      isNaN(Number(item.kuria_share))
        ? 0
        : Number(item.kuria_share);


    daikiTotal += daikiShare;

    kuriaTotal += kuriaShare;


    if(item.payer === "だいき"){

      daikiBalance += amount - daikiShare;

      kuriaBalance -= kuriaShare;

    }else{

      kuriaBalance += amount - kuriaShare;

      daikiBalance -= daikiShare;
    }


const imageSrc =
  item.image ||
  "https://placehold.co/200x200?text=No+Image";

html += `
  <details class="card">

    <summary>

      <div class="summary-row">

        <img
          class="expense-image"
          src="${imageSrc}"
        >

        <div class="expense-main">

          <div>
            <strong>${item.title}</strong>
          </div>

          <div class="expense-date">
            ${new Date(item.date).toLocaleDateString()}
          </div>

        </div>

        <div class="expense-price">
          ¥${item.amount}
        </div>

      </div>

    </summary>

    <div class="detail">

      <p>${item.memo}</p>

      <p>
        だいき：¥${item.daiki_share}
      </p>

      <p>
        くりあ：¥${item.kuria_share}
      </p>

    </div>

  </details>
`;
  });


  const totalAmount = daikiTotal + kuriaTotal;


  const now = new Date();

  const year = now.getFullYear();

  const month = now.getMonth() + 1;


  document.getElementById("settlementCard").innerHTML = `
    <h2>${year}年${month}月</h2>

    <p>
      合計 ¥${totalAmount.toLocaleString()}
    </p>

    <p>
      だいき ¥${daikiTotal.toLocaleString()}
    </p>

    <p>
      くりあ ¥${kuriaTotal.toLocaleString()}
    </p>
  `;


  document.getElementById("history").innerHTML = html;
}


function showHome(){

  document.getElementById("homePage")
    .style.display = "block";

  document.getElementById("addPage")
    .style.display = "none";

  document.getElementById("historyPage")
    .style.display = "none";
}


function showAddPage(){

  document.getElementById("homePage")
    .style.display = "none";

  document.getElementById("addPage")
    .style.display = "block";

  document.getElementById("historyPage")
    .style.display = "none";
}


function showHistoryPage(){

  document.getElementById("homePage")
    .style.display = "none";

  document.getElementById("addPage")
    .style.display = "none";

  document.getElementById("historyPage")
    .style.display = "block";

  loadMonthlyHistory();
}


async function loadMonthlyHistory(){

  const response =
    await fetch(
      GAS_URL +
      "?type=getMonthList"
    );

  const months =
    await response.json();

  let html = "";

  months.forEach(month => {

    const [year, monthNum] =
      month.split("-");

    html += `

      <details
        class="card"
        ontoggle="
          if(this.open){
            loadMonthDetail(
              '${year}',
              '${monthNum}',
              this
            );
          }
        "
      >

        <summary>

          <h2>
            ${year}年${monthNum}月
          </h2>

        </summary>

        <div class="month-detail">
          読み込み中...
        </div>

      </details>

    `;
  });

  document.getElementById(
    "monthlyHistory"
  ).innerHTML = html;

}

async function loadMonthDetail(
  year,
  month,
  element
){

  const detail =
    element.querySelector(".month-detail");

  if(detail.dataset.loaded){
    return;
  }

  const response =
    await fetch(
      GAS_URL +
      `?type=getExpensesByMonth&year=${year}&month=${month}`
    );

  const data =
    await response.json();

  data.reverse();

let total = 0;
let daikiTotal = 0;
let kuriaTotal = 0;

let html = "";

data.forEach(item => {

  total += Number(item.amount) || 0;

  daikiTotal +=
    Number(item.daiki_share) || 0;

  kuriaTotal +=
    Number(item.kuria_share) || 0;

  const imageSrc =
    item.image ||
    "https://placehold.co/200x200?text=No+Image";

  html += `

    <details class="card">

      <summary>

        <div class="summary-row">

          <img
            class="expense-image"
            src="${imageSrc}"
            loading="lazy"
          >

          <div class="expense-main">

            <div>
              <strong>${item.title}</strong>
            </div>

            <div class="expense-date">
              ${new Date(item.date).toLocaleDateString()}
            </div>

          </div>

          <div class="expense-price">
            ¥${item.amount}
          </div>

        </div>

      </summary>

    </details>

  `;
});

html = `

  <div class="card">

    <h2>
      ${year}年${month}月
    </h2>

    <p>
      合計 ¥${total.toLocaleString()}
    </p>

    <p>
      だいき ¥${daikiTotal.toLocaleString()}
    </p>

    <p>
      くりあ ¥${kuriaTotal.toLocaleString()}
    </p>

  </div>

` + html;

detail.innerHTML = html;

detail.dataset.loaded = "true";

}

 


//画像アップ部分
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const base64 = reader.result.split(",")[1]; // data:image/...除去
      resolve(base64);
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


async function uploadImage(file) {
  const base64 = await toBase64(file);

  const res = await fetch(GAS_URL, {
    method: "POST",
    body: JSON.stringify({
      type: "image",
      fileName: file.name,
      image: base64
    })
  });

  const json = await res.json();
  return json.url; // ← DriveのURL
}


async function submitExpense(formData, imageFile) {
  let imageUrl = "";

  // 画像があるときだけアップ
  if (imageFile) {
    imageUrl = await uploadImage(imageFile);
  }

  await fetch(GAS_URL, {
    method: "POST",
    body: JSON.stringify({
      type: "expense",
      id: formData.id,
      date: formData.date,
      title: formData.title,
      amount: formData.amount,
      payer: formData.payer,
      daiki_share: formData.daiki_share,
      kuria_share: formData.kuria_share,
      memo: formData.memo,
      category: formData.category,
      image: imageUrl // ←ここ重要
    })
  });
}


async function handleSubmit() {
  const file = document.getElementById("imageInput").files[0];

  const formData = {
    id: Date.now().toString(),
    date: "2026-05-11",
    title: "テスト",
    amount: 500,
    payer: "daiki",
    daiki_share: 250,
    kuria_share: 250,
    memo: "",
    category: "food"
  };

  await submitExpense(formData, file);

  alert("完了");
}


loadExpenses();

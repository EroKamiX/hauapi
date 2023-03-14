const express = require("express");
const axios = require("axios");
const app = express();
const tabletojson = require("tabletojson").Tabletojson;
const DomParser = require("dom-parser");
const entities = require("html-entities");

var axiosIntannce = axios.create({});

async function Checklogin(username, password, cookieHau) {
  let config = {
    method: "post",
    url: "https://tinchi.hau.edu.vn/DangNhap/CheckLogin",
    headers: {
      authority: "tinchi.hau.edu.vn",
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "vi,en;q=0.9,en-US;q=0.8",
      "cache-control": "max-age=0",
      "content-type": "application/x-www-form-urlencoded",
      cookie: cookieHau,
      origin: "https://tinchi.hau.edu.vn",
      referer: "https://tinchi.hau.edu.vn/",
      "sec-ch-ua":
        '"Chromium";v="110", "Not A(Brand";v="24", "Microsoft Edge";v="110"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 Edg/110.0.1587.63",
    },
    maxRedirects: 1,
    data: "Role=0&UserName=" + username + "&Password=" + password,
  };
  try {
    let response = await axios(config);
    return response;
  } catch (error) {
    return error;
  }
}
async function login(username, password, cookieHau) {
  let res = await Checklogin(username, password, cookieHau);
  if (res.request.path.includes("/SinhVien/Home")) {
    return true;
  }
  return false;
}

async function cookieRender() {
  try {
    let res = await get("https://tinchi.hau.edu.vn/");
    let setCookie = res.headers["set-cookie"];
    let cookie = setCookie[0].split(";")[0];
    return cookie;
  } catch (error) {
    return error;
  }
}

async function get(url, cookieHau = "") {
  var configs = {
    headers: {
      accept: "text/html, */*; q=0.01",
      "accept-language": "vi,en;q=0.9,en-US;q=0.8",
      "sec-ch-ua":
        '"Chromium";v="110", "Not A(Brand";v="24", "Microsoft Edge";v="110"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-requested-with": "XMLHttpRequest",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 Edg/110.0.1587.63",
      cookie: cookieHau,
    },
    maxRedirects: 0,
  };
  try {
    let res = await axiosIntannce.get(url, configs);
    return res;
  } catch (error) {
    return error;
  }
}

function converLichHoc(data) {
  try {
    let lich_hoc = [];
    let monhoc = {};
    monhoc.STT = data[0].STT;
    monhoc["Tên học phần"] = data[0]["Tên học phần"];
    monhoc["Số tín chỉ"] = data[0]["Số tín chỉ"];
    monhoc["Tên lớp tín chỉ"] = data[0]["Tên lớp tín chỉ"];
    monhoc["Giáo viên"] = data[0]["Giáo viên"];
    monhoc.time = [];
    let time = {};
    time["Thời gian"] = data[0]["Thời gian"];
    time["Thứ"] = data[0]["Thứ"];
    time["Tiết"] = data[0]["Tiết"];
    time["Phòng"] =  (data[0]["Phòng"] .includes("Online") ) ? "Online" : data[0]["Phòng"] ;
    monhoc.time.push({
      ...time,
    });
    for (let i = 1; i < data.length; i++) {
      const item = data[i];
      if (monhoc.STT != item.STT) {
        lich_hoc.push(monhoc);
        monhoc = {};
        monhoc.STT = item.STT;
        monhoc["Tên học phần"] = item["Tên học phần"];
        monhoc["Số tín chỉ"] = item["Số tín chỉ"];
        monhoc["Tên lớp tín chỉ"] = item["Tên lớp tín chỉ"];
        monhoc["Giáo viên"] = item["Giáo viên"];
        monhoc.time = [];
        let time = {};
        time["Thời gian"] = item;
        time["Thứ"] = item["Thứ"];
        time["Tiết"] = item["Tiết"];
        time["Phòng"] = (item["Phòng"].includes("Online") ) ? "Online" : item["Phòng"] ;
        monhoc.time.push({
          ...time,
        });
      } else {
        let time = {};
        time["Thời gian"] = item["Thời gian"];
        time["Thứ"] = item["Thứ"];
        time["Tiết"] = item["Tiết"];
        time["Phòng"] = (item["Phòng"].includes("Online") ) ? "Online" : item["Phòng"];
        monhoc.time.push({
          ...time,
        });
      }
    }
    lich_hoc.push(monhoc);
    return lich_hoc;
  } catch (error) {
    return error;
  }
}

app.get("/", (req, res) => {
  res.send("SERVER ON!");
});

app.get("/getCookie", async (req, res) => {
  try {
    let cookie = await cookieRender();
    return res.status(200).send(cookie);
  } catch (error) {
    return res.status(404).send(error);
  }
});

app.get("/login", async (req, res) => {
  try {
    if (!req.query.username) {
      return res.status(403).send("Missing params");
    }
    if (!req.query.password) {
      return res.status(403).send("Missing params");
    }
    if (!req.query.cookie) {
      return res.status(403).send("Missing params");
    }
    let username = req.query.username;
    let password = req.query.password;
    let cookie = req.query.cookie;
    let checkLogin = await login(username, password, cookie);
    if (checkLogin) {
      return res.status(200).send(true);
    } else {
      return res.status(200).send(false);
    }
  } catch (error) {
    return res.status(400);
  }
});

app.get("/ThongTinLichHoc", async (req, res) => {
  try {
    if (!req.query.HocKy) {
      return res.status(403).send("Missing params");
    }
    if (!req.query.NamHoc) {
      return res.status(403).send("Missing params");
    }
    if (!req.query.cookie) {
      return res.status(403).send("Missing params");
    }

    let HocKy = req.query.HocKy;
    let NamHoc = req.query.NamHoc;
    let cookie = req.query.cookie;
    let response = await get(
      "https://tinchi.hau.edu.vn/TraCuuLichHoc/ThongTinLichHoc?HocKy=" +
        HocKy +
        "&NamHoc=" +
        NamHoc +
        "&ChuyenNganh=0&Dothoc=1",
      cookie
    );
    if (response.status != 200) {
      return res.status(403).send("Timeout Seesion");
    }
    let data = response.data.replace(/[\r\n]/g, "");
    let convert = tabletojson.convert(data);
    return res.status(200).send(JSON.stringify(converLichHoc(convert[0])));
  } catch (error) {
    console.log(error);
    return res.status(400).send(error);
  }
});

app.get("/ThongTinLichThi", async (req, res) => {
  try {
    if (!req.query.HocKy) {
      return res.status(403).send("Missing params");
    }
    if (!req.query.NamHoc) {
      return res.status(403).send("Missing params");
    }
    if (!req.query.cookie) {
      return res.status(403).send("Missing params");
    }

    let HocKy = req.query.HocKy;
    let NamHoc = req.query.NamHoc;
    let cookie = req.query.cookie;
    let response = await get(
      "https://tinchi.hau.edu.vn/TraCuuLichThi/ThongTinLichThi?HocKy=" +
        HocKy +
        "&NamHoc=" +
        NamHoc +
        "&ChuyenNganh=0&Dothoc=1",
      cookie
    );
    if (response.status != 200) {
      return res.status(403).send("Timeout Seesion");
    }
    let data = response.data.replace(/[\r\n]/g, "");
    let convert = tabletojson.convert(data);
    return res.status(200).send(JSON.stringify(convert[0]));
  } catch (error) {
    return res.status(400).send(error);
  }
});

app.get("/TraCuuDiem", async (req, res) => {
  try {
    if (!req.query.cookie) {
      return res.status(403).send("Missing params");
    }

    let HocKy = req.query.HocKy || -1;
    let NamHoc = req.query.NamHoc || -1;
    let cookie = req.query.cookie;
    let response = await get(
      "https://tinchi.hau.edu.vn/TraCuuDiem/Index",
      cookie
    );

    if (response.status != 200) {
      return res.status(403).send("Timeout Seesion");
    }
    // let response = await get(
    //   "https://tinchi.hau.edu.vn/TraCuuDiem/ThongTinDiemSinhVien?HocKy="+HocKy+"&NamHoc="+NamHoc+"&ChuyenNganh=0",
    //   cookie
    // );
    let ThongTinDiemSinhVien = {};
    let data = response.data.replace(/[\r\n]/g, "");
    // .replace("TBCTichLuy", "bonusPoint");
    var parser = new DomParser();
    let document = parser.parseFromString(data);
    ThongTinDiemSinhVien.MaSinhVien = entities.decode(
      document.getElementById("MaSinhVien").innerHTML.replaceAll(" ", "")
    );
    ThongTinDiemSinhVien.XepLoaiHTH4 = entities.decode(
      document.getElementById("XepLoaiHTH4").innerHTML
    );
    ThongTinDiemSinhVien.XepLoaiHTH10 = entities.decode(
      document.getElementById("XepLoaiHTH10").innerHTML
    );
    ThongTinDiemSinhVien.TBHTH4 = entities.decode(
      document.getElementById("TBHTH4").innerHTML
    );
    ThongTinDiemSinhVien.TBCTichLuyH4 = entities.decode(
      document.getElementById("TBCTichLuy").innerHTML
    );
    ThongTinDiemSinhVien.TinChiTichLuy = entities.decode(
      document.getElementById("TinChiTichLuy").innerHTML
    );
    ThongTinDiemSinhVien.TinChiHocTap = entities.decode(
      document.getElementById("TinChiHocTap").innerHTML
    );
    ThongTinDiemSinhVien.TBCTichLuyH10 = entities.decode(
      document.getElementById("TBCTichLuyH10").innerHTML
    );
    let bangdiem;
    let table = document.getElementsByTagName("table");
    bangdiem = tabletojson.convert(table[2].outerHTML);
    ThongTinDiemSinhVien.bangdiem = bangdiem[0];
    return res.status(200).send(JSON.stringify(ThongTinDiemSinhVien));
  } catch (error) {
    console.log(error);
    return res.status(400).send(error);
  }
});

app.get("/ThongTinDiemSinhVien", async (req, res) => {
  try {
    if (!req.query.cookie) {
      return res.status(403).send("Missing params");
    }

    let HocKy = req.query.HocKy || -1;
    let NamHoc = req.query.NamHoc || -1;
    let cookie = req.query.cookie;
    // let response = await get(
    //   "https://tinchi.hau.edu.vn/TraCuuDiem/Index",
    //   cookie
    // );

    let response = await get(
      "https://tinchi.hau.edu.vn/TraCuuDiem/ThongTinDiemSinhVien?HocKy=" +
        HocKy +
        "&NamHoc=" +
        NamHoc +
        "&ChuyenNganh=0",
      cookie
    );
    if (response.status != 200) {
      return res.status(403).send("Timeout Seesion");
    }
    let ThongTinDiemSinhVien = {};
    let data = response.data
      .replace(/[\r\n]/g, "")
      .replace("TBCTichLuy", "bonusPoint");
    var parser = new DomParser();
    let document = parser.parseFromString(data);
    ThongTinDiemSinhVien.MaSinhVien = entities.decode(
      document.getElementById("bonusPoint").innerHTML.replaceAll(" ", "")
    );
    ThongTinDiemSinhVien.XepLoaiHTH4 = entities.decode(
      document.getElementById("XepLoaiHTH4").innerHTML
    );
    ThongTinDiemSinhVien.XepLoaiHTH10 = entities.decode(
      document.getElementById("XepLoaiHTH10").innerHTML
    );
    ThongTinDiemSinhVien.TBHTH4 = entities.decode(
      document.getElementById("TBHTH4").innerHTML
    );
    ThongTinDiemSinhVien.TBCTichLuyH4 = entities.decode(
      document.getElementById("TBCTichLuy").innerHTML
    );
    ThongTinDiemSinhVien.TinChiTichLuy = entities.decode(
      document.getElementById("TinChiTichLuy").innerHTML
    );
    ThongTinDiemSinhVien.TinChiHocTap = entities.decode(
      document.getElementById("TinChiHocTap").innerHTML
    );
    ThongTinDiemSinhVien.TBCTichLuyH10 = entities.decode(
      document.getElementById("TBCTichLuyH10").innerHTML
    );
    let bangdiem;
    let table = document.getElementsByTagName("table");
    bangdiem = tabletojson.convert(table[0].outerHTML);
    ThongTinDiemSinhVien.bangdiem = bangdiem[0];
    return res.status(200).send(JSON.stringify(ThongTinDiemSinhVien));
  } catch (error) {
    console.log(error);
    return res.status(400).send(error);
  }
});

app.get("/TraCuuHocPhi", async (req, res) => {
  try {
    if (!req.query.cookie) {
      return res.status(403).send("Missing params");
    }

    let HocKy = req.query.HocKy || -1;
    let NamHoc = req.query.NamHoc || -1;
    let cookie = req.query.cookie;
    // let response = await get(
    //   "https://tinchi.hau.edu.vn/TraCuuDiem/Index",
    //   cookie
    // );

    let response = await get(
      "https://tinchi.hau.edu.vn/TraCuuHocPhi/Index",
      cookie
    );
    if (response.status != 200) {
      return res.status(403).send("Timeout Seesion");
    }
    let data = response.data.replace(/[\r\n]/g, "");
    var parser = new DomParser();
    let document = parser.parseFromString(data);
    let taiChinh = {};
    let table = document.getElementsByTagName("table");
    let short = tabletojson.convert(table[0].outerHTML)[0];
    let phainop = 0;
    let danop = 0;
    let thuaThieu = 0;
    short.forEach((item) => {
      phainop += parseInt(
        item["Số tiền phải nộp"]
          .slice(0, item["Số tiền phải nộp"].length - 3)
          .replaceAll(",", "")
          .replaceAll(".", "")
      );
      danop += parseInt(
        item["Số tiền đã nộp"]
          .slice(0, item["Số tiền đã nộp"].length - 3)
          .replaceAll(",", "")
          .replaceAll(".", "")
      );
      thuaThieu += parseInt(
        item["Thừa thiếu"]
          .slice(0, item["Thừa thiếu"].length - 3)
          .replaceAll(",", "")
          .replaceAll(".", "")
      );
    });
    taiChinh.phainop = phainop;
    taiChinh.danop = danop;
    taiChinh.thuaThieu = thuaThieu;
    taiChinh.short = short;
    taiChinh.detail = tabletojson.convert(table[2].outerHTML)[0];
    return res.status(200).send(JSON.stringify(taiChinh));
  } catch (error) {
    console.log(error);
    return res.status(400).send(error);
  }
});

app.listen(3000, () => {
  console.log("localhost:3000");
});

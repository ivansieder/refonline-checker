import dayjs from "dayjs";
import fs from "fs/promises";
import notifier from "node-notifier";
import puppeteer from "puppeteer";

const users = JSON.parse((await fs.readFile("./users.json", "utf8"))).map((user) => ({
  ...user,
  found: false,
  notified: false,
}));

while (users.filter((user) => user.notified === false).length > 0) {
  await handler();
  await wait(10);
}

async function handler() {
  let browser = null;

  try {
    browser = await puppeteer.launch();
    
    for (const user of users.filter((user) => user.found === false)) {
      const page = await browser.newPage();
      await page.goto("https://refonline.sabes.it/");
  
      await page.click("input[type='submit'][value='Accept']");
  
      await page.waitForSelector("input#FiscalCode");
  
      await page.evaluate(({ user }) => {
        document.querySelector("input#FiscalCode").value = user.fiscalCode;
        document.querySelector("input#Otp").value = user.token;
      }, { user });
  
      await page.click("input[type='submit'][value='View documents']");
  
      await page.waitForSelector("input[type='button'][value='Logoff']");
  
      const reportExists = await page.evaluate(() => {
        const tableAlert = document.querySelector("table.tbl_wartezeiten div.alert");
  
        return !tableAlert || tableAlert.textContent.trim() !== "REPORT NOT AVAILABLE";
      });
  
      await page.close();
  
      if (reportExists) {
        user.found = true
      } else {
        console.log(`${dayjs().format("YYYY-MM-DD HH:mm:ss")} - No report found for ${user.name}`);
      }
    }
  
    const usersToNotify = users.filter((user) => user.found === true && user.notified === false);

    if (usersToNotify.length > 0) {
      for (const user of usersToNotify) {
        user.notified = true;
      }

      notifier.notify(`Report found for: ${usersToNotify.map((user) => user.name).join(", ")}`);
    }

    console.log("-------------------------------------------------------------------------");
  } catch (error) {
    console.error(error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function wait(seconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  })
}
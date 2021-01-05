import dayjs from "dayjs";
import fetch from "node-fetch"
import fs from "fs/promises";
import notifier from "node-notifier";
import puppeteer from "puppeteer";

const config = JSON.parse((await fs.readFile("./config.json", "utf8")));

const telegramConfig = config.telegram;

const users = config.users.map((user) => ({
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
  
      await page.waitForSelector("table.tbl_wartezeiten");
  
      const reportExists = await page.evaluate(() => {
        const body = document.querySelector("body").textContent;
  
        return body.includes("REPORT NOT AVAILABLE") === false && body.includes("GENERIC ERROR") === false;
      });

      if (reportExists) {
        user.found = true;
      } else {
        console.log(`${dayjs().format("YYYY-MM-DD HH:mm:ss")} - No report found for ${user.name}`);
      }

      await page.close();
    }
  
    const usersToNotify = users.filter((user) => user.found === true && user.notified === false);

    if (usersToNotify.length > 0) {
      for (const user of usersToNotify) {
        user.notified = true;
      }

      const message = `Report found for: ${usersToNotify.map((user) => user.name).join(", ")}`

      notifier.notify(message);

      if (telegramConfig.chatId && telegramConfig.token) {
        await fetch(`https://api.telegram.org/bot${telegramConfig.token}/sendMessage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: message,
            chat_id: telegramConfig.chatId
          })
        })
      }
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
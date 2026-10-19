async (parent) => {
  const page = await parent.context().newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const groups = [
    {
      id: "default",
      name: "Uncategorized",
      kind: "default",
      order: 0,
      pinned: false,
    },
    { id: "team", name: "Test group", kind: "custom", order: 1, pinned: false },
    {
      id: "cron",
      name: "Scheduled tasks",
      kind: "cron",
      order: 2,
      pinned: false,
    },
    {
      id: "subagents",
      name: "Subagents",
      kind: "subagents",
      order: 3,
      pinned: false,
    },
  ];
  const chats = [
    {
      id: "7b66c61c-c17c-4eaa-a03e-ef8efc860523",
      session_id: "fixture-session",
      user_id: "fixture-user",
      channel: "console",
      source: "chat",
      name: "Conversation to move",
      group_id: "team",
      created_at: "2026-10-19T01:00:00Z",
      updated_at: "2026-10-19T01:00:00Z",
      status: "idle",
    },
  ];
  const writes = [];
  await page.addInitScript(() => {
    localStorage.setItem("qwenpaw_session_group_mode", "source");
    localStorage.setItem("language", "en");
    window.EventSource = class {
      close() {}
      addEventListener() {}
      removeEventListener() {}
    };
  });
  await page.route("**/api/**", async (route) => {
    const req = route.request(),
      path = new URL(req.url()).pathname;
    if (!path.startsWith("/api/")) return route.continue();
    let value = [];
    if (path === "/api/chats/groups") value = groups;
    else if (path === "/api/chats") value = chats;
    else if (path === "/api/chats/" + chats[0].id && req.method() === "PUT") {
      const body = req.postDataJSON();
      writes.push({ path, body });
      chats[0].group_id = body.group_id;
      value = chats[0];
    } else if (path.endsWith("/status")) value = { status: "idle" };
    else if (path.endsWith("/stats")) value = { unreadCount: 0 };
    await route.fulfill({ json: value });
  });
  try {
    await page.setViewportSize({ width: 1000, height: 800 });
    await page.goto(
      "http://127.0.0.1:5181/output/playwright/sidebar-groups.html",
    );
    await page
      .getByText("Conversation to move", { exact: true })
      .first()
      .waitFor({ timeout: 45000 });
    const measurements = [];
    for (const target of [
      "Scheduled task conversations",
      "Conversations with subagents",
    ]) {
      const conversation = page
        .getByText("Conversation to move", { exact: true })
        .first();
      const point = await conversation.boundingBox();
      await page.mouse.move(point.x + 70, point.y + point.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(320);
      const header = page
        .getByRole("button")
        .filter({
          has: page.locator('[class*="SessionGroupHeader-module__label"]', {
            hasText: target,
          }),
        })
        .first();
      const targetBox = await header.boundingBox();
      await page.mouse.move(
        targetBox.x + 75,
        targetBox.y + targetBox.height / 2,
        { steps: 12 },
      );
      await page.waitForTimeout(150);
      await page.mouse.up();
      await page.waitForTimeout(450);
      if (await header.locator('[class*="collapsed"]').count())
        await header.click();
      await conversation.hover();
      await page.waitForTimeout(200);
      const geometry = await page.evaluate((target) => {
        const header = [
          ...document.querySelectorAll(
            '[class*="SessionGroupHeader-module__header"]',
          ),
        ].find((e) => e.textContent.includes(target));
        const item = [
          ...document.querySelectorAll('[class*="sessionItem-module__item"]'),
        ].find((e) => e.textContent.includes("Conversation to move"));
        const row = header.parentElement;
        const h = header.getBoundingClientRect(),
          s = item.getBoundingClientRect(),
          r = row.getBoundingClientRect(),
          style = getComputedStyle(header);
        return {
          target,
          headerTop: h.top,
          headerBottom: h.bottom,
          sessionTop: s.top,
          gap: s.top - h.bottom,
          rowHeight: r.height,
          requiredHeight:
            h.height +
            parseFloat(style.marginTop) +
            parseFloat(style.marginBottom),
          marginTop: style.marginTop,
          headerOverflow: h.bottom - r.bottom,
        };
      }, target);
      measurements.push(geometry);
      if (geometry.gap < 2 || geometry.rowHeight !== geometry.requiredHeight)
        throw Error("Source header overlaps conversation: " + JSON.stringify(geometry));
      await page.screenshot({
        path:
          "D:/Desktop/QwenPaw-session-group-fix/console/output/playwright/source-group-" +
          target.replaceAll(" ", "-") +
          ".png",
      });
    }
    const conversation=page.getByText('Conversation to move',{exact:true}).first();
    const point=await conversation.boundingBox();
    await page.mouse.move(point.x+70,point.y+point.height/2);
    await page.mouse.down();await page.waitForTimeout(320);
    const team=page.locator('[class*="SessionGroupHeader-module__header"]').filter({hasText:'Test group'}).first();
    const box=await team.boundingBox();
    await page.mouse.move(box.x+70,box.y+box.height/2,{steps:8});
    await page.keyboard.press('Escape');await page.mouse.up();await page.waitForTimeout(200);
    if(writes.length!==2 || chats[0].group_id!=='subagents')throw Error('Cancelled drag changed the group');
    const ordinaryHeight=await team.evaluate(e=>e.parentElement.getBoundingClientRect().height);
    if(ordinaryHeight!==36)throw Error('Ordinary group height changed');
    await page.evaluate(()=>document.documentElement.classList.add('dark-mode'));
    await conversation.hover();
    await page.screenshot({path:'D:/Desktop/QwenPaw-session-group-fix/console/output/playwright/after-dark-subagents.png'});
    if(errors.length)throw Error(JSON.stringify(errors));
    return { measurements, writes, errors, cancelledDragPreservedGroup:true, ordinaryHeight };
  } catch (error) {
    return {
      error: String(error),
      errors,
      body: (await page.locator("body").innerText()).slice(0, 1500),
    };
  } finally {
    await page.close();
  }
}

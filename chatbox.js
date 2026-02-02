import { generateUUID } from "./uuid.js";

const currentUUID = generateUUID();

const agentAvatarPath ="https://res.cloudinary.com/daitjz3vl/image/upload/v1769263688/cross-svgrepo-com_lwjv9x.svg";
const closeIconPath = "https://res.cloudinary.com/daitjz3vl/image/upload/v1769263688/cross-svgrepo-com_lwjv9x.svg";
const sendIconPath = "https://res.cloudinary.com/daitjz3vl/image/upload/v1769263646/send-alt-1-svgrepo-com_sjwqoj.svg";
const logoPath = "https://res.cloudinary.com/daitjz3vl/image/upload/v1769263688/cross-svgrepo-com_lwjv9x.svg";
const reload = "https://res.cloudinary.com/daitjz3vl/image/upload/v1769263556/reload-svgrepo-com_no8prp.svg";
const baseURL = "http://127.0.0.1:8000/api/v1"
class Chatbox {
  constructor(options) {
    this.agentId = options.agentId;
    this.contact = options.contact || {};
    this.userHistory = [];
    this.initialMessages = options.initialMessages || [];
    this.context = options.context || "";
    this.secretChatId = options.secret_chat_id;
    this.currentUUID = currentUUID;
    this.chatBotName = options.name_chat_bot;
    this.domainHostName = window.location.hostname;
    this.iconWidget = "";
    this.closeIconPath = "";
    this.startMessage = [];
    this.showWelcomeMessage = true;
    this.iconBot = "";
    this.access = false

    this.fetchChatboxConfig();
  }

  setCookie(name, value, days, path = "/", secure = true, sameSite = "Lax") {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = "expires=" + date.toUTCString();
    const secureFlag = secure ? ";secure" : "";
    const sameSiteFlag = sameSite ? ";SameSite=" + sameSite : "";
    document.cookie =
      name +
      "=" +
      value +
      ";" +
      expires +
      ";path=" +
      path +
      secureFlag +
      sameSiteFlag;
  }

  getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  async getUserConversationHistory(user_uuid) {
    try {
      const response = await fetch(
        `${baseURL}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_uuid: user_uuid
          }),
        }
      );
      const data = await response.json();
      this.userHistory = data;
    } catch (error) {
      console.error("Error fetching user conversation history:", error);
      return [];
    }
  }

  addTypingAnimation(iconUrl) {
    const typingContainer = document.createElement("div");
    typingContainer.className =
      "chatbox-message-container bot typing-container";

    // Create a wrapper for the icon
    const iconWrapper = document.createElement("div");
    iconWrapper.id = "icon-wrapper";

    if (iconUrl) {
      const icon = document.createElement("img");
      icon.src = iconUrl;
      icon.className = "bot-icon";
      iconWrapper.appendChild(icon);
    }

    typingContainer.appendChild(iconWrapper);

    const typingDots = `
      <div class="typing-animation">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    `;
    typingContainer.innerHTML += typingDots; // Append typing animation after the icon wrapper

    this.chatMessages.appendChild(typingContainer);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    return typingContainer;
  }

  async fetchChatboxConfig(get_data = true) {
    let user_uuid;
    if (this.getCookie("user_uuid_key")) {
      user_uuid = this.getCookie("user_uuid_key");
    } else {
      user_uuid = this.currentUUID;
      this.setCookie("user_uuid_key", this.currentUUID, 1);
    }
    if (get_data) {
      await this.getUserConversationHistory(user_uuid);
    }

    const response = await fetch(
      `${baseURL}/chat_bot/secret_key/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret_key: this.secretChatId
        }),
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch chatbox config");
      return;
    }
    const data = await response.json();
    if (!data) {
      console.error("No data received for chatbox config");
      return;
    }
    const {
      styles: { icon_bot = agentAvatarPath, icon_widget = logoPath, main_color },
      predefined_answers,
      welcome_messages,
    } = data;
    this.access = true; // Assume access is granted if response is OK (no 'access' field in new response)
    this.iconBot = icon_bot;
    this.iconWidget = icon_widget;
    this.closeIconPath = closeIconPath;
    this.startMessages = welcome_messages ? [welcome_messages.message] : []; // Handle as single message object
    console.log(this.startMessages);
    
    this.createChatbox();
    this.initMessages();

    const sendButton = this.chatboxElement.querySelector("#sendButton img");
    if (sendButton) {
      sendButton.style.path = main_color;
    }

    // Update main color
    document.documentElement.style.setProperty("--main-color", main_color);

    // Get elements
    const chatboxHeader = this.chatboxElement.querySelector(".chatbox-header");
    const agentAvatar = this.chatboxElement.querySelector(".agent-avatar");
    const chatButton = this.chatButton;

    // Check if elements exist before updating styles
    if (chatboxHeader) {
      chatboxHeader.style.backgroundColor = main_color;
    } else {
      console.error(".chatbox-header not found");
    }

    if (agentAvatar) {
      agentAvatar.src = icon_bot;
    } else {
      console.error(".agent-avatar not found");
    }

    if (chatButton) {
      chatButton.style.backgroundImage = `url(${icon_widget})`;
      chatButton.style.backgroundSize = "30px 30px";
      chatButton.style.backgroundPosition = "center";
      chatButton.style.backgroundRepeat = "no-repeat";
    } else {
      console.error("#chatButton not found");
    }

    // Save bot icon URL
    this.iconBot = icon_bot;

    // Display start_messages
    if (this.startMessages.length > 0) {
      this.startMessages.forEach((msg) => {
        this.addMessage("bot", msg, this.iconBot, false);
      });
    }

    // Display predefined_answers as buttons
    if (predefined_answers && predefined_answers.length > 0) {
      this.displayPredefinedAnswers(predefined_answers);
    }
  }
  formatText(message) {
    if (!message){
      return message
    }
    const removeBrackets = message.replace(/\[[^\]]*\]/g, "");

    const cleanedText = removeBrackets.replace(/\(([^)]+)\)/g, "$1");

    message = cleanedText.replace(
      /(\b(https?:\/\/|www\.)[^\s]+(?:\.[^\s]+)?)/g,
      function (url) {
        const trimmedUrl = url.replace(/[).]+$/, "");

        if (trimmedUrl.startsWith("www")) {
          return `<a href="https://${trimmedUrl}" target="_blank" class="link-styles">${trimmedUrl}</a>`;
        }

        return `<a href="${trimmedUrl}" target="_blank" class="link-styles">${trimmedUrl}</a>`;
      }
    );

    // Handle bold text: **text**
    message = message.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");

    // Handle italic text: *text*
    message = message.replace(/\*(.*?)\*/g, "<i>$1</i>");

    // Handle headings: # Heading
    message = message.replace(/^#\s(.*$)/gm, "<h1>$1</h1>");

    // Handle inline code: code
    message = message.replace(/`(.*?)`/g, "<code>$1</code>");

    // Handle blockquotes: > Quote
    message = message.replace(/^\s*>\s(.*)$/gm, "<blockquote>$1</blockquote>");

    // Handle unordered list: - List item
    message = message.replace(/^\s*-\s(.*)$/gm, "<li>$1</li>");
    message = message.replace(/(<li>.*<\/li>)/gms, "<ul>$1</ul>");
    message = message.replace(/<\/ul>\s*<ul>/g, "");

    // Handle ordered list: 1. List item
    message = message.replace(/^\s*\d+\.\s(.*)$/gm, "<li>$1</li>");
    message = message.replace(/(<li>.*<\/li>)/gms, "<ol>$1</ol>");
    message = message.replace(/<\/ol>\s*<ol>/g, "");

    return message;
  }

  createChatbox() {
    console.log(this.access);
    if (this.access==false){
      return 
    }
    const existingChatbox = document.querySelector(".chatbox-container");
    if (existingChatbox) {
      existingChatbox.remove();
    }
    this.chatboxElement = document.createElement("div");
    this.chatboxElement.className = "chatbox-container";
    this.chatboxElement.innerHTML = `
      <div class="chatbox-header" id="chatbox-header">
        <div class="chatbox-header-buttons" id="chatbox-header-buttons">
          <button class="reload-button" id="reload-button"><img src="${reload}" alt="Reload"></button>
        </div>
        <div class="chatbox-header-avatar-wrapper" id="chatbox-header-avatar-wrapper">
          <span class="chatBotName" id="chatBotName">${this.chatBotName}</span>
        </div>
      </div>
      <div id="chatMessages" class="chatbox-messages"></div>
      <div class="chatbox-input" id="chatbox-input">
        <textarea id="chatInput" placeholder="Type a message..."></textarea>
        <button id="sendButton"><img class="send-button" id="send-button" src="${sendIconPath}" alt="Send"></button>
      </div>
      <div class="chatbox-footer" id="chatbox-footer">
        <span>Powered by <a class="chatbox-footer-link" id="chatbox-footer-link">Khaulin</a></span>
      </div>
    `;

    this.chatButton = document.createElement("button");
    this.chatButton.id = "chatButton";
    this.chatButton.className = "chatbox-chat-button";
    document.body.appendChild(this.chatButton);

    document.body.appendChild(this.chatboxElement);

    this.chatMessages = this.chatboxElement.querySelector("#chatMessages");
    this.chatInput = this.chatboxElement.querySelector("#chatInput");
    this.sendButton = this.chatboxElement.querySelector("#sendButton");
    this.closeButton = this.chatboxElement.querySelector("#close-button");
    this.reloadButton = this.chatboxElement.querySelector("#reload-button");

    this.sendButton.addEventListener("click", () => this.sendMessage());

    this.chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        if (this.chatInput.value.trim() === "") {
          e.preventDefault();
        } else {
          e.preventDefault();
          this.sendMessage();
          this.chatInput.value = "";
        }
      } else if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        let textarea = e.target;
        let cursorPosition = textarea.selectionStart;
        let textBeforeCursor = textarea.value.substring(0, cursorPosition);
        let textAfterCursor = textarea.value.substring(cursorPosition);
        textarea.value = textBeforeCursor + "\n" + textAfterCursor;
        textarea.selectionStart = cursorPosition + 1;
        textarea.selectionEnd = cursorPosition + 1;
      }
    });

    this.chatInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        this.chatInput.placeholder = "Type a message...";
      }
    });

    this.reloadButton.addEventListener("click", () => this.reloadChatbox());

    this.chatboxElement.style.display = "none";

    this.chatInput.placeholder = "Type a message...";

    if (this.showWelcomeMessage && !this.getCookie("is_closed_hello_message")) {
      const startMessagesContainer = document.createElement("div");
      startMessagesContainer.id = "startMessagesContainerId";
      startMessagesContainer.className = "start-messages-container";
      document.body.appendChild(startMessagesContainer);

      this.startMessages.forEach((message, index) => {
        const startMessageBlock = document.createElement("div");
        startMessageBlock.id = `startMessageBlock${index}`;
        startMessageBlock.className = "start-message-block";
        startMessageBlock.innerHTML = `
          <div class="start-message-relative" id="start-message-relative">
            <div class="start-message-bot" id="start-message${index}">${message}</div>
            ${
              index === 0
                ? `
              <button class="close-start-message" id="close-start-message"><img src="${closeIconPath}" width="25px" alt="Close"></button>
              `
                : ""
            }
          </div>
        `;

        startMessagesContainer.appendChild(startMessageBlock);

        const startMessageBlockId = document.getElementById(
          "startMessagesContainerId"
        );

        if (index === 0) {
          const closeStartMessageButton = startMessageBlock.querySelector(
            ".close-start-message"
          );

          closeStartMessageButton.addEventListener("click", (event) => {
            event.stopPropagation();
            this.showWelcomeMessage = false;
            startMessageBlockId.style.display = "none";
            this.setCookie("is_closed_hello_message", true, 1);
          });

          startMessageBlockId.addEventListener("click", () => {
            startMessageBlockId.style.display = "none";
            this.openChatbox();
          });

          const startMessageBlockIcon = startMessageBlock.querySelector(
            "#start-message-avatar"
          );

          if (startMessageBlockIcon) {
            startMessageBlockIcon.addEventListener("click", () => {
              startMessageBlockId.style.display = "none";
              this.openChatbox();
            });
          }
        }

        const startMessage1 = document.getElementById("start-message1");
        const startMessage2 = document.getElementById("start-message2");
        const startMessage3 = document.getElementById("start-message3");
        const startMessage4 = document.getElementById("start-message4");

        if (startMessage1) {
          startMessage1.style.marginLeft = "65px";
        }

        if (startMessage2) {
          startMessage2.style.marginLeft = "65px";
        }

        if (startMessage3) {
          startMessage3.style.marginLeft = "65px";
        }

        if (startMessage4) {
          startMessage4.style.marginLeft = "65px";
        }
      });
    }

    this.chatButton.addEventListener("click", () => {
      if (this.chatboxElement.style.display === "none") {
        const startMessageBlockId = document.getElementById(
          "startMessagesContainerId"
        );
        this.openChatbox();
        if (startMessageBlockId) {
          startMessageBlockId.style.display = "none";
        }
      } else {
        this.closeChatbox();
      }
    });
  }

  openChatbox() {
    const startMessageBlockId = document.getElementById(
      "startMessagesContainerId"
    );
    if (startMessageBlockId) {
      startMessageBlockId.style.display = "none";
    }
    this.chatboxElement.style.display = "flex";
    this.chatButton.style.backgroundImage = `url(${closeIconPath})`;
    if (this.userHistory) {
      for (let i = 0; i < this.userHistory.length; i++) {
        this.addMessage(
          "user",
          this.userHistory[i]["user_message"],
          undefined,
          false
        );
        this.addMessage(
          "bot",
          this.formatText(this.userHistory[i]["chat_answer"]),
          this.iconBot,
          false
        );
      }
      this.userHistory = [];
    }
  }

  closeChatbox() {
    const startMessageBlockId = document.getElementById(
      "startMessagesContainerId"
    );
    if (startMessageBlockId && this.showWelcomeMessage) {
      startMessageBlockId.style.display = "flex";
    }

    this.chatboxElement.style.display = "none";
    this.chatButton.style.backgroundImage = `url(${this.iconWidget})`;
    this.chatButton.style.backgroundSize = "28px 28px";
    this.chatButton.style.backgroundPosition = "center";
    this.chatButton.style.backgroundRepeat = "no-repeat";
  }

  reloadChatbox() {
    this.chatMessages.innerHTML = "";
    this.showWelcomeMessage = false;
    this.fetchChatboxConfig(false).then(() => {
      this.openChatbox();
    });
    this.setCookie("user_uuid_key", currentUUID, 1);
    this.initMessages();
  }

  initMessages() {
    this.initialMessages.forEach((message) => {
      this.addMessage("bot", message);
    });
  }

  addMessage(from, message, iconUrl, show_animation = true) {
    const messageContainer = document.createElement("div");
    messageContainer.className = `chatbox-message-container ${from}`;

    if (from === "bot" && iconUrl) {
      const wrapper = document.createElement("div");
      wrapper.id = "icon-wrapper";

      const icon = document.createElement("img");
      icon.src = iconUrl;
      icon.className = "bot-icon";

      wrapper.appendChild(icon);
      messageContainer.appendChild(wrapper);
    }

    const messageElement = document.createElement("div");
    messageElement.className = `chatbox-message ${from}`;

    // Check if the message contains ul, ol, li
    const containsLists = /<ul|<ol|<li/.test(message);

    if (from === "bot" && containsLists) {
      messageElement.style.padding = "0";
    } else {
      messageElement.style.padding = "5px 10px";
    }
    if (show_animation) {
      if (from == "bot") {
        const speed = 25; // Speed of typing in milliseconds
        let i = 0;
        let html_tag_key = false;
        let current_tag = "";
        const type = () => {
          if (i < message.length) {
            if (message.charAt(i) === "<" || html_tag_key) {
              html_tag_key = true;
              current_tag += message.charAt(i);

              if (message.charAt(i) === ">") {
                html_tag_key = false;
                current_tag = ""; // Reset the tag buffer
              }

              i++;
              setTimeout(type, speed);
            } else {
              if (i + 1 == message.length || (i + 1) % 120 == 0) {
                this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
              }
              messageElement.innerHTML += message.charAt(i);
              i++;
              setTimeout(type, speed);
            }
          } else {
            // If the message contains HTML elements, display them properly after typing completes
            messageElement.innerHTML = message;
          }
        };
        type();
      } else {
        messageElement.innerHTML = message;
      }
    } else {
      messageElement.innerHTML = message;
    }

    messageContainer.appendChild(messageElement);
    this.chatMessages.appendChild(messageContainer);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  displayPredefinedAnswers(answers) {
    // Container for buttons
    const container = document.createElement("div");
    container.style.marginBottom = "20px";
    container.style.display = "flex";
    container.style.flexWrap = "wrap";
    container.style.gap = "5px";

    answers.forEach((answer) => {
      const button = document.createElement("button");
      button.className = "chatbox-predefined-answer";
      button.innerText = answer.question;
      button.addEventListener("click", () => {
        this.handlePredefinedAnswerClick(answer);
      });
      container.appendChild(button);
    });

    this.chatMessages.appendChild(container);
  }

  async handlePredefinedAnswerClick(answer) {
    this.addMessage("user", answer.question);

    // Add animation
    const typingContainer = this.addTypingAnimation();

    // Typing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Delete animation
    typingContainer.remove();

    // Text formatter before answer
    const formattedAnswer = this.formatText(answer.answer);

    this.addMessage("bot", formattedAnswer, this.iconBot);
  }

  async sendMessage() {
    const message = this.chatInput.value;
    if (!message) return;

    this.addMessage("user", message);
    this.chatInput.value = "";
    this.chatInput.focus();

    // Add typing animation with bot icon
    const typingContainer = this.addTypingAnimation(this.iconBot);

    const botResponse = await this.getBotResponse(
      this.secretChatId,
      message
    );
    console.log(botResponse);
    
    const formattedResponse = this.formatText(botResponse.chat_answer);
    console.log(formattedResponse);
    // Remove typing animation
    typingContainer.remove();

    this.addMessage("bot", formattedResponse, this.iconBot);
  }

  async getBotResponse(secretKey, message) {
    try {
      let user_uuid;
      if (this.getCookie("user_uuid_key")) {
        user_uuid = this.getCookie("user_uuid_key");
      } else {
        user_uuid = this.currentUUID;
        this.setCookie("user_uuid_key", this.currentUUID, 1);
      }
      const response = await fetch(
        `${baseURL}/chat_bot/query`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${secretKey}`,
          },
          body: JSON.stringify({
            user_uuid: user_uuid,
            query: message
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        if (
        data.detail &&
        data.detail === "Access from this domain is not allowed for the chat bot."
      ) {
        return data.detail;
      }
       throw error
      }
      

      return data;
    } catch (error) {
      console.error("Failed to get bot response:", error);
      return {"chat_answer": "Sorry, I couldn't process your request at the moment."};
    }
  }
}

// Initialize chatbox
export function initBubble(options) {
  new Chatbox(options);
}

// Add styles to match the provided screenshot
const styles = document.createElement("style");
styles.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
      :root {
        --main-color: #f37021; /* Default color */
      }

      *{
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      ul, ol {
        padding: 0;
      }

      .start-messages-container {
        position: fixed;
        bottom: 110px;
        right: 30px;
        display: flex;
        flex-direction: column;
        gap: 10px; /* Adds space between each message block */
        z-index: 9999999999;
      }

      @media screen and (max-width: 440px) {
        .start-messages-container{
           bottom: 65px !important;
           right: 20px;
        }
      }
      
      .start-message-block {
        display: flex;
      }
      
      #start-message-relative {
        position: relative;
        display: flex;
        align-items: center;
      }
      
      #icon-wrapper {
        margin-right: 10px !important;
      }
      
      .start-message-bot {
        background-color: #f1f1f1; /* Example background color */
        padding: 10px;
        border-radius: 5px;
      }
      
      #close-start-message {
        background: none;
        border: none;
        cursor: pointer;
        margin-left: 10px;
      }
      
  
      .chatbox-container {
        width: 390px;
        height: 70vh;
        max-height: 600px;
        position: fixed;
        bottom: 120px;
        right: 30px;
        display: flex;
        flex-direction: column;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        z-index: 9999999999;
      }
    
      #chatbox-header {
        background: var(--main-color);
        color: white;
        padding: 20px 15px;
        display: flex;
        flex-direction: row-reverse;
        justify-content: space-between;
        align-items: center;
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
      }
  
      .close-button{
          background: transparent;
          border: none;
      }

      .close-button img {
        width: 17px;
        height: 17px;
      }

      .logo {
       width: 25px;
      }

      #send-button {
         width: 25px;
         height: 25px;
         margin-top: 2px;
        }

      #chatBotName {
        font-size: 18px;
        font-weight: 500;
        font-family: Inter;
      }

      #reload-button {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: initial;
      }
      
      #reload-button img {
        width: 22px;
        height: 22px;
      }
    
      .agent-avatar {
        width: 30px;
        height: 30px;
        margin-right: 10px;
        border-radius: 50%;
      }

      #start-message-relative{
        position: relative;
        display: flex;
      }

      #close-start-message{
        width: 24px;
        height: 24px;
        border: none;
        background: var(--main-color);
        color: white;
        cursor: pointer;
        border-radius: 50%;
        position: absolute;
        right: 0px;
        top: -33px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999999999;
        padding: initial;
      }

      #chatbox-header-avatar-wrapper{
        display: flex;
        align-items: center;
      }

      .chatbox-message-container {
        display: flex;
        width: 100%;
        margin-bottom: 12px;
      }
      
      .chatbox-message-container.bot {
        justify-content: flex-start;
      }

      .chatbox-message-container.bot ol{
        padding: 0;
      }
      
      .chatbox-message-container.user {
        justify-content: flex-end;
      }
    
      .chatbox-messages {
        flex: 1;
        padding: 20px 10px;
        overflow-y: auto;
        background: #fff;
        height: 266px;
        overflow: auto;
      }
    
      #chatbox-input {
        display: flex;
        padding: 10px 10px 0 10px;
        position: relative;
        background: #fff;
      }
    
      #chatbox-input textarea {
        resize: none;
        flex: 1;
        padding: 10px 60px 10px 10px;
        border: 1px solid rgba(248, 248, 248, 1);
        border-radius: 4px;
        outline: none;
        box-shadow: none;
        font-family: "Inter";
        align-content: center;
        background-color: rgba(248, 248, 248, 1);
        font-size: 15px !important;
      }
    
      #chatbox-input button {
        width: 40px;
        height: 40px;
        border: none;
        background: var(--main-color);
        color: white;
        cursor: pointer;
        border-radius: 8px;
        position: absolute;
        right: 28px;
        top: 24px;
        padding: initial;
      }
    
      #chatbox-footer {
        padding: 10px;
        text-align: center;
        align-items: center;
        display: flex;
        justify-content: center;
        width: 100%;
        margin: 0 auto;
        background-color: #fff;
        
        border-bottom-left-radius: 10px;
        border-bottom-right-radius: 10px;
      }

      #chatbox-footer{
        font-size: 13px !important;
        font-family: 'Inter';
        font-weight: 500;
      }
  
      .chatbox-footer-link{
          text-decoration: none;
          color: rgba(239, 77, 7, 1) !important;
      }
    
      .chatbox-chat-button {
        position: fixed;
        bottom: 30px;
        right: 30px;
        background-color: var(--main-color) !important;
        color: white !important;
        border: none;
        height: 70px;
        width: 70px;
        border-radius: 50% !important;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        background-repeat: no-repeat;
        background-position: center;
        z-index: 999999999;
      }

      .link-styles{
        text-decoration: underline !important;
        color: #fff !important;
      }
    
      .chatbox-message.user {
        background: #F8F8F8;
        color: #333;
        padding: 10px;
        border-radius: 4px;
        margin-bottom: 12px;
        max-width: 70%;
        align-self: flex-end;
        font-size: 15px !important;
        font-family: "Inter";
        word-wrap: break-word;
      }
      
      .chatbox-message.bot {
        text-align: left;
        background: var(--main-color);
        color: white;
        border-radius: 4px;
        margin-bottom: 12px;
        padding: 10px !important;
        min-width: 15px;
        max-width: fit-content;
        align-self: flex-start;
        font-size: 15px !important;
        font-family: "Inter";
        max-width: 300px;
      }

      .start-message-bot{
        text-align: left;
        background: var(--main-color);
        color: white;
        border-radius: 4px;
        margin-bottom: 12px;
        padding: 10px;
        min-width: 15px;
        max-width: 300px;
        align-self: flex-start;
        font-size: 15px!important;
        font-family: "Inter";
      }
      
      .chatbox-predefined-answer {
        background:var(--main-color);
        color: white;
        border: none;
        padding: 5px 10px !important;
        margin: 5px 5px 5px 5px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 15px !important;
        font-family: "Inter";
        font-weight: 500;
      }

      #icon-wrapper{
        display: flex;
        align-items: center;
        flex-direction: column;
        justify-content: center;
        background: #F8F8F8;
        border-radius: 50%;
        width: 45px;
        height: 45px;
        margin-right: 10px;
      }
      
      .bot-icon {
        width: 24px;
        height: 24px;
      }

      .typing-animation {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--main-color);
        max-height: 30px;
        padding: 6px 15px 0px 15px !important;
        border-radius: 4px;
        margin-top: 7px;
        gap: 5px;
    }
    
      .dot {
        width: 6px;
        height: 6px;
        background-color: #FFF;
        border-radius: 50%;
        animation: bounce-animation-of-dots-2023242526 1.4s infinite ease-in-out both !important;
      }
    
      .dot:nth-child(2) {
        animation-delay: 0.2s !important;
      }
    
      .dot:nth-child(3) {
        animation-delay: 0.4s !important;
      }
    
      @keyframes bounce-animation-of-dots-2023242526 {
        20%, 53%, 80%, 0%, 100% {
          animation-timing-function: cubic-bezier(.215, .61, .355, 1);
          transform: translate3d(0, 0, 0);
        }
      
        40%, 43% {
          animation-timing-function: cubic-bezier(.755, .050, .855, .060);
          transform: translate3d(0, -4px, 0);
        }
      
        70% {
          animation-timing-function: cubic-bezier(.755, .050, .855, .060);
          transform: translate3d(0, -6px, 0);
        }
      
        90% {
          transform: translate3d(0, -4px, 0);
        }
      }

      @media screen and (max-width: 440px) {
        .chatbox-container{
          right: 8px;
          width: 96%;
          height: 85%;
          bottom: 80px
        }
        .chatbox-chat-button{
          height: 50px;
          width: 50px;
          right: 20px;
          bottom: 20px;
          background-size: 22px 22px !important;
        }
      }
    `;
document.head.appendChild(styles);
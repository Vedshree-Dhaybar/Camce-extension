
// ==========================================
// CAMCE Keyboard Shortcut
// Ctrl + Shift + Y
// ==========================================

chrome.commands.onCommand.addListener(
    async (command) => {

        console.log(
            "CAMCE command received:",
            command
        );


        // Only handle CAMCE shortcut
        if (
            command !== "activate_camce"
        ) {
            return;
        }


        try {

            // ==================================
            // Get active tab
            // ==================================

            const tabs =
                await chrome.tabs.query({
                    active: true,
                    currentWindow: true
                });


            if (
                !tabs ||
                tabs.length === 0
            ) {

                console.log(
                    "CAMCE: No active tab"
                );

                return;
            }


            const tab =
                tabs[0];


            console.log(
                "CAMCE: Active tab:",
                tab.url
            );


            // ==================================
            // STEP 1
            // Send pause command
            // ==================================

            console.log(
                "CAMCE: Sending pause command..."
            );


            const response =
                await new Promise((resolve) => {

                    chrome.tabs.sendMessage(
                        tab.id,
                        {
                            action:
                                "PAUSE_VIDEO"
                        },
                        (result) => {

                            if (
                                chrome.runtime.lastError
                            ) {

                                console.error(
                                    "CAMCE pause error:",
                                    chrome.runtime.lastError.message
                                );

                                resolve({
                                    success: false,
                                    error:
                                        chrome.runtime
                                            .lastError
                                            .message
                                });

                                return;
                            }


                            resolve(result);

                        }
                    );

                });


            console.log(
                "CAMCE pause response:",
                response
            );


            // ==================================
            // STEP 2
            // Small delay
            // ==================================

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        150
                    )
            );


            // ==================================
            // STEP 3
            // Open CAMCE popup
            // ==================================

            try {

                await chrome.action.openPopup();

                console.log(
                    "CAMCE popup opened"
                );

            } catch (popupError) {

                console.error(
                    "CAMCE popup error:",
                    popupError
                );

            }

        } catch (error) {

            console.error(
                "CAMCE shortcut error:",
                error
            );

        }

    }
);


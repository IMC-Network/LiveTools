const HUMAN_AVERAGE_WPM = 150;

var lastSavedContentTimeout;
var lastSavedNameTimeout;
var scriptActiveElement = null;

function generateRandomKey(length = 16, digits = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_") {
    var key = "";

    for (var i = 0; i < length; i++) {
        key += digits.charAt(Math.floor(Math.random() * digits.length));
    }

    return key;
}

function cleanHTML(html) {
    return html.replace(/<script/g, "&lt;script").replace(/<\/script/g, "&lt;/script").replace(/<style/g, "&lt;style").replace(/<\/style/g, "&lt;/style").replace(/<link/g, "&lt;link");
}

function timeToDuration(time) {
    var hours = Number(time.split(":")[0]) || 0;
    var minutes = Number(time.split(":")[1]) || 0;
    var seconds = Number(time.split(":")[2]) || 0;

    return (hours * 60 * 60) + (minutes * 60) + seconds;
}

function loadScript() {
    firebase.database().ref(episodePath + "/content/script").once("value", function(snapshot) {
        var sectionOrder = snapshot.val().sectionOrder;
        var sectionNames = snapshot.val().sectionNames;
        var sectionContents = snapshot.val().sectionContents;

        $(".script").html("");

        for (var i = 0; i < sectionOrder.length; i++) {
            $(".script").append(
                $("<details open>")
                    .attr("data-key", sectionOrder[i])
                    .append([
                        $("<summary>")
                            .append(
                                $("<input>")
                                    .attr("placeholder", "Untitled section")
                                    .val(sectionNames[sectionOrder[i]] || "")
                            )
                        ,
                        $("<div contenteditable='true'>").html(cleanHTML(sectionContents[sectionOrder[i]]))
                    ])
            );
        }

        useScriptProperties();
    });
}

function saveScriptOrder() {
    var sectionOrder = [];

    $(".script details").each(function() {
        sectionOrder.push($(this).attr("data-key"));
    });

    firebase.database().ref(episodePath + "/content/script/sectionOrder").set(sectionOrder);
}

function cueSaveScript(element) {
    clearTimeout(lastSavedContentTimeout);

    lastSavedContentTimeout = setTimeout(function() {
        firebase.database().ref(episodePath + "/content/script/sectionContents/" + $(element).closest("details").attr("data-key")).set($(element).closest("details > div").html());
    }, 1000);
}

function getParagraphDuration(element) {
    if (isNaN(Number($(element).closest("section").attr("data-duration")))) {
        return $(element).closest("section").text().trim().split(" ").length * (60 / HUMAN_AVERAGE_WPM) * 1000;
    } else {
        return Number($(element).closest("section").attr("data-duration")) * 1000;
    }
}

function getSectionDuration(element) {
    var totalDuration = 0;

    $(element).closest("details").find("section").each(function() {
        totalDuration += getParagraphDuration(this);
    });

    return totalDuration;
}

function getScriptDuration() {
    var totalDuration = 0;

    $(".script").find("details").each(function() {
        totalDuration += getSectionDuration(this);
    });

    return totalDuration;
}

function useScriptProperties() {
    $(".scriptPropertiesTitle").text("Script properties");

    $(".scriptPropertiesContent").html("").append([
        $("<label>").append([
            $("<span>")
                .attr("title", "This is the total duration of the script.")
                .text("Duration")
            ,
            $("<input type='time' disabled>")
                .attr("title", "This is the total duration of the script.")
                .val(new Date(getScriptDuration()).toISOString().split("T")[1].split(".")[0])
        ]),
        $("<div>").append([
            $("<button class='maxWidth lineSpace'>")
                .text("Add section")
                .attr("title", "Create a new named collapsible section that can contain paragraphs and directives.")
                .click(function() {
                    var newSectionKey = generateRandomKey();

                    $("<details open>")
                        .attr("data-key", newSectionKey)
                        .append([
                            $("<summary>").append([
                                $(document.createTextNode(" ")),
                                $("<input>").attr("placeholder", "Untitled section")
                            ]),
                            $("<div contenteditable='true'>").append($("<section>").html("<br>").focus())
                        ])
                        .insertAfter(
                            $(document.getSelection().anchorNode).closest(".script details").length == 0 ?
                            $(".script details:last") :
                            $(document.getSelection().anchorNode).closest(".script details")
                        )
                    ;

                    firebase.database().ref(episodePath + "/content/script/sectionNames/" + newSectionKey).set("");
                    firebase.database().ref(episodePath + "/content/script/sectionContents/" + newSectionKey).set("<section><br></section>");

                    saveScriptOrder();
                })
        ])
    ]);
}

function useSectionProperties(element) {
    $(".scriptPropertiesTitle").html("").append([
        $("<a>")
            .html("<i aria-hidden='true' class='material-icons'>arrow_left</i> Back")
            .attr("href", "javascript:useScriptProperties();")
        ,
        $(document.createTextNode("Section properties"))
    ]);

    $(".scriptPropertiesContent").html("").append([
        $("<label>").append([
            $("<span>")
                .attr("title", "This is the total duration of this section.")
                .text("Duration")
            ,
            $("<input type='time' disabled>")
                .attr("title", "This is the total duration of this section.")
                .val(new Date(getSectionDuration(element)).toISOString().split("T")[1].split(".")[0])
        ]),
        $("<div>").append([
            $("<button class='maxWidth lineSpace'>")
                .text("Delete section")
                .attr("title", "Delete this section and its contents.")
                .click(function() {
                    if ($(".script").children().length > 1) {
                        firebase.database().ref(episodePath + "/content/script/sectionNames/" + $(element).closest("details").attr("data-key")).remove();
                        firebase.database().ref(episodePath + "/content/script/sectionContents/" + $(element).closest("details").attr("data-key")).remove();

                        $(element).closest("details").remove();

                        saveScriptOrder();

                        useScriptProperties();
                    } else {
                        alert("There is only one section in this script; you cannot have a script with no sections.", "Cannot delete section");
                    }
                })
        ])
    ]);
}

function useContentProperties(element) {
    $(".scriptPropertiesTitle").html("").append([
        $("<a>")
            .html("<i aria-hidden='true' class='material-icons'>arrow_left</i> Back")
            .attr("href", "javascript:useScriptProperties();")
        ,
        $(document.createTextNode("Content properties"))
    ]);

    $(".scriptPropertiesContent").html("").append([
        $("<div class='lineSpace'>").append([
            $("<button title='Undo (Ctrl + Z)' aria-label='Undo' class='tool'>")
                .html("<i class='material-icons'>undo</i>")
                .on("click", function() {
                    document.execCommand("undo")
                })
            ,
            $("<button title='Redo (Ctrl + Shift + Z or Ctrl + Y)' aria-label='Redo' class='tool'>")
                .html("<i class='material-icons'>redo</i>")
                .on("click", function() {
                    document.execCommand("redo")
                })
            ,
            $("<button title='Bold (Ctrl + B)' aria-label='Bold' class='tool'>")
                .html("<i class='material-icons'>format_bold</i>")
                .on("click", function() {
                    document.execCommand("bold")
                })
            ,
            $("<button title='Underline (Ctrl + U)' aria-label='Underline' class='tool'>")
                .html("<i class='material-icons'>format_underline</i>")
                .on("click", function() {
                    document.execCommand("underline")
                })
            ,
            $("<button title='Italic (Ctrl + I)' aria-label='Italic' class='tool'>")
                .html("<i class='material-icons'>format_italic</i>")
                .on("click", function() {
                    document.execCommand("italic")
                })
            ,
            $("<button title='Toggle directive' aria-label='Toggle directive' class='tool'>")
                .html("<i class='material-icons'>directions</i>")
                .on("click", function() {
                    $(scriptActiveElement).closest("section").toggleClass("directive");

                    cueSaveScript(scriptActiveElement);
                })
        ]),
        $("<label>").append([
            $("<span>").text("Duration"),
            $("<input type='time' min='00:00:00' max='23:59:59' step='1'>")
                .val(new Date(getParagraphDuration(element)).toISOString().split("T")[1].split(".")[0])
                .change(function(event) {
                    if (timeToDuration($(event.target).val()) == Math.floor($(element).closest("section").text().trim().split(" ").length * (60 / HUMAN_AVERAGE_WPM))) {
                        $(element).closest("section").removeAttr("data-duration");
                    } else {
                        $(element).closest("section").attr("data-duration", timeToDuration($(event.target).val()));
                    }

                    cueSaveScript(element);
                })
        ]),
        $("<div>").append([
            $("<button class='maxWidth lineSpace'>")
                .text("Add directive below")
                .attr("title", "Create a directive that can be used to alert or remind the crew about a certain event that is to be cued.")
                .click(function() {
                    $("<section class='directive'>").html("Write an imperative here...").insertAfter($(element).closest("section"));
                })
            ,
            $("<button class='maxWidth lineSpace'>")
                .text("Add VT directive below")
                .attr("title", "Create a directive that can be used to remind the crew to play a certain video tape (VT) or package.")
                .click(function() {
                    $("<section class='directive'>").html("<strong>[VT]</strong> Slug").insertAfter($(element).closest("section"));
                })
            ,
            $("<button class='maxWidth lineSpace'>")
                .text("Add ULAY directive below")
                .attr("title", "Create a directive that can be used to remind the crew to play a certain underlay (ULAY) video which is played with live commentary from the presenters.")
                .click(function() {
                    $("<section class='directive'>").html("<strong>[ULAY]</strong> Slug").insertAfter($(element).closest("section"));
                })
            ,
            $("<button class='maxWidth lineSpace'>")
                .text("Add SOT directive below")
                .attr("title", "Create a directive that can be used to remind the crew to play a certain 'sound on tape' (SOT) video which contains quoted words (which are transcribed).")
                .click(function() {
                    $("<section class='directive'>").html("<strong>[SOT]</strong> Slug<br><em>Write SOT transcription here...</em>").insertAfter($(element).closest("section"));
                })
        ])
    ]);
}

events.userReady.push(function() {
    setInterval(function() {
        $(".script details > div").each(function() {
            if ($(this).html() == "") {
                $(this).html("<section><br></section>");
            }
        });
    });

    $(".script").on("keypress", function(event) {
        var container = document.getSelection().anchorNode.nodeType == Node.TEXT_NODE ? document.getSelection().anchorNode.parentNode : document.getSelection().anchorNode;
        
        if (event.keyCode == 13 && !event.shiftKey) {
            setTimeout(function() {
                $(container).closest("section").next()
                    .removeClass("directive")
                    .removeAttr("data-duration")
                    .text("")
                ;
            });
        }
    });

    $("body").on("click focus keyup keydown keypress change paste input", ".script", function() {
        useScriptProperties();
    });

    $("body").on("click focus keyup keydown keypress change paste input", ".script details > summary", function(event) {
        if (document.getSelection().anchorNode != null) {
            var container = document.getSelection().anchorNode.nodeType == Node.TEXT_NODE ? document.getSelection().anchorNode.parentNode : document.getSelection().anchorNode;

            useSectionProperties(container);

            event.stopPropagation();
        }
    });

    $("body").on("click focus keyup keydown keypress change paste input", ".script details > summary > input", function(event) {
        clearTimeout(lastSavedNameTimeout);

        lastSavedNameTimeout = setTimeout(function() {
            firebase.database().ref(episodePath + "/content/script/sectionNames/" + $(event.target).closest("details").attr("data-key")).set($(event.target).val());
        }, 1000);

        useSectionProperties($(event.target).closest("details"));

        if (event.keyCode == 32) {
            if ($(event.target).closest("details").attr("open")) {
                $(event.target).closest("details").removeAttr("open");
            } else {
                $(event.target).closest("details").attr("open", "");
            }
        }

        event.stopPropagation();
    });

    $("body").on("click focus keyup keydown keypress change paste input", ".script details > div", function(event) {
        if (document.getSelection().anchorNode != null) {
            var container = document.getSelection().anchorNode.nodeType == Node.TEXT_NODE ? document.getSelection().anchorNode.parentNode : document.getSelection().anchorNode;

            useContentProperties(container);

            event.stopPropagation();
        }
    });

    $("body").on("change paste input", ".script details > div", function(event) {
        cueSaveScript(event.target);
    });

    $(".script").on("click focus keyup keydown keypress change paste input", function() {
        scriptActiveElement = document.getSelection().anchorNode;
    });

    $(".script").sortable({
        handle: "summary",
        cancel: "input, details > div",
        axis: "y",
        update: saveScriptOrder
    });

    firebase.database().ref(episodePath + "/content/script/sectionOrder").on("value", function() {
        loadScript();
    });

    firebase.database().ref(episodePath + "/content/script/sectionContents").on("child_changed", function(snapshot) {
        if ($(document.activeElement).closest("details").attr("data-key") != snapshot.key) {
            $("details[data-key='" + snapshot.key + "']").find("> div").html(cleanHTML(snapshot.val()));
        }
    });

    firebase.database().ref(episodePath + "/content/script/sectionNames").on("child_changed", function(snapshot) {
        $("details[data-key='" + snapshot.key + "']").find("> summary > input").val(snapshot.val());
    });
});
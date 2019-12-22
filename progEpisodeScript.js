const HUMAN_AVERAGE_WPM = 150;

function timeToDuration(time) {
    var hours = Number(time.split(":")[0]) || 0;
    var minutes = Number(time.split(":")[1]) || 0;
    var seconds = Number(time.split(":")[2]) || 0;

    return (hours * 60 * 60) + (minutes * 60) + seconds;
}

function getParagraphDuration(element) {
    if (isNaN(Number($(element).attr("data-duration")))) {
        return $(element).closest("section").text().trim().split(" ").length * (60 / HUMAN_AVERAGE_WPM) * 1000;
    } else {
        return Number($(element).attr("data-duration")) * 1000;
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
                    $("<details open>")
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
        ]),
        $("<label>").append([
            $("<span>").text("Duration"),
            $("<input type='time' min='00:00:00' max='23:59:59' step='1'>")
                .val(new Date(getParagraphDuration(element)).toISOString().split("T")[1].split(".")[0])
                .change(function(event) {
                    if (timeToDuration($(event.target).val()) == Math.floor($(element).closest("section").text().trim().split(" ").length * (60 / HUMAN_AVERAGE_WPM))) {
                        $(element).removeAttr("data-duration");
                    } else {
                        $(element).attr("data-duration", timeToDuration($(event.target).val()));
                    }
                })
        ]),
        $("<div>").append([
            $("<button class='maxWidth lineSpace'>")
                .text("Add controller directive below")
                .attr("title", "Create a controller directive that can be used to alert or remind the crew about a certain event that is to be cued.")
                .click(function() {
                    $("<section class='directive'>").html("Write an imperative here...").insertAfter($(element).closest("section"));
                })
            ,
            $("<button class='maxWidth lineSpace'>")
                .text("Add VT directive below")
                .attr("title", "Create a directive that can be used to remind the crew to play a certain video tape (VT) or package.")
                .click(function() {
                    $("<section class='directive'>").html("<strong>[ID]</strong> Slug").insertAfter($(element).closest("section"));
                })
            ,
            $("<button class='maxWidth lineSpace'>")
                .text("Add SOT directive below")
                .attr("title", "Create a directive that can be used to remind the crew to play a certain 'sound on tape' (SOT) video which contains quoted words (which are transcribed).")
                .click(function() {
                    $("<section class='directive'>").html("<strong>[ID]</strong> Slug SOT<br><em>Write SOT transcription here...</em>").insertAfter($(element).closest("section"));
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

    $("body").on("keypress", ".script", function(event) {
        var container = document.getSelection().anchorNode.nodeType == Node.TEXT_NODE ? document.getSelection().anchorNode.parentNode : document.getSelection().anchorNode;
        
        if (event.keyCode == 13 && !event.shiftKey) {
            setTimeout(function() {
                $(container).closest("section").next().removeClass("directive").text("");
            });
        }
    });

    $("body").on("click focus keyup keydown keypress change paste input", ".script", function() {
        useScriptProperties();
    });

    $("body").on("click focus keyup keydown keypress change paste input", ".script details > div", function(event) {
        if (document.getSelection().anchorNode != null) {
            var container = document.getSelection().anchorNode.nodeType == Node.TEXT_NODE ? document.getSelection().anchorNode.parentNode : document.getSelection().anchorNode;
            
            useContentProperties(container);

            event.stopPropagation();
        }
    });

    $("body").on("click focus keyup keydown keypress change paste input", ".script details > summary", function(event) {
        if (document.getSelection().anchorNode != null) {
            var container = document.getSelection().anchorNode.nodeType == Node.TEXT_NODE ? document.getSelection().anchorNode.parentNode : document.getSelection().anchorNode;
            
            useSectionProperties(container);

            event.stopPropagation();
        }
    });

    $(".script").sortable({
        handle: "summary",
        cancel: "input, details > div",
        axis: "y"
    });

    useScriptProperties();
});
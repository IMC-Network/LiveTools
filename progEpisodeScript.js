function useScriptProperties() {
    $(".scriptPropertiesTitle").text("Script properties");

    $(".scriptPropertiesContent").html("").append(
        $("<button class='maxWidth'>")
            .text("Add section")
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
    );
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
                $(container).closest("section").next().removeClass("directive");                
            });
        }
    });

    $(".script").click(function() {
        useScriptProperties();
    });

    $(".script").sortable({
        cancel: "input, details > div",
        axis: "y"
    });

    useScriptProperties();
});
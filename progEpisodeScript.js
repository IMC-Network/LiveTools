events.userReady.push(function() {
    setInterval(function() {
        if ($(".script").html() == "") {
            $(".script").html("<section></section>")
        }
    });
});
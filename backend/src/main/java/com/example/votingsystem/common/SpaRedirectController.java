package com.example.votingsystem.common;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaRedirectController {

    @RequestMapping(value = {
        "/events",
        "/e/**",
        "/login",
        "/signup",
        "/forgot",
        "/reset",
        "/itc",
        "/bridge",
        "/voting",
        "/voting/**",
        "/my-vote",
        "/admin",
        "/admin/**"
    })
    public String redirect() {
        return "forward:/index.html";
    }
}

package com.example.votingsystem.dashboard.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class DashboardCounterService {
    private static final Logger log = LoggerFactory.getLogger(DashboardCounterService.class);
    private final ConcurrentHashMap<String, AtomicLong> counters = new ConcurrentHashMap<>();

    public void bump(Long eventId, Long categoryId) {
        String key = eventId + ":" + categoryId;
        long v = counters.computeIfAbsent(key, k -> new AtomicLong(0)).incrementAndGet();
        log.info("[DashboardCounter] eventId={}, categoryId={}, bumps={}", eventId, categoryId, v);
    }

    public long get(Long eventId, Long categoryId) {
        var a = counters.get(eventId + ":" + categoryId);
        return a == null ? 0L : a.get();
    }
}



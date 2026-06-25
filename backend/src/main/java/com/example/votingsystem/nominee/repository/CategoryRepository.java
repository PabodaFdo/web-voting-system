package com.example.votingsystem.nominee.repository;

import com.example.votingsystem.nominee.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    // all categories that belong to an Event (Category has: private Event event;)
    List<Category> findByEvent_Id(Long eventId);
}

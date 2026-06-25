package com.example.votingsystem.nominee.repository;

import com.example.votingsystem.nominee.entity.Nominee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface NomineeRepository extends JpaRepository<Nominee, Long> {

    List<Nominee> findByCategory_Id(Long categoryId);

    // used by the bundle endpoint
    List<Nominee> findByCategory_IdIn(Collection<Long> categoryIds);
}

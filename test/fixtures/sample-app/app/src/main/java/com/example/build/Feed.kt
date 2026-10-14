package com.example.build

// Replaced AsyncTask with coroutines (comment must NOT trigger a violation)
class FeedRepository {
    fun refresh() = GlobalScope.launch { }
}

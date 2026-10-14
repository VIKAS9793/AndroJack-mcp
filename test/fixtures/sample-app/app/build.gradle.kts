// Fixture for the CI dogfood step and validate-CLI tests. Intentionally
// contains violations; never used as a real build.
plugins { id("com.android.application") }
dependencies {
    kapt("com.google.dagger:hilt-compiler:2.57")
    implementation("androidx.camera:camera-core:1.4.2")
}

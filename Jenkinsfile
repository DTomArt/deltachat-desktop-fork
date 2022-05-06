pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                echo 'Building...'
                sh 'docker-compose build deltachat-build'
            }
            post {
                success {
                    echo 'Build completed successfully!'
                }
                failure {
                    echo 'Error in build!'
                    sh 'false'
                }
            }
        }
        stage('Test') {
            steps {
                echo 'Testing..'
                sh 'docker-compose build --no-cache deltachat-test'
				sh 'docker-compose up --force-recreate -d deltachat-test'
            }
            post {
                success {
                    echo 'Testing completed successfully!'
                }
                failure {
                    echo 'Error in testing!'
                    sh 'false'
                }
            }
        }
    }
}
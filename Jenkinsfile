pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                echo 'Building..'
                sh 'docker-compose build'
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
                sh 'docker-compose build'
				sh 'docker-compose up'
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
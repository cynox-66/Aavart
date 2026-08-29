import logging
import time

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def run() -> None:
    logger.info("optimizer worker foundation ready; queue execution is not implemented")
    while True:
        time.sleep(30)


if __name__ == "__main__":
    run()

